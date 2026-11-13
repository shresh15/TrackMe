const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const sendTelegramNotification = require("../services/telegramNotifications");

const router = express.Router();
const APPLICATION_STATUSES = [
  "Interested",
  "Applied",
  "OA/Test",
  "Interview",
  "Selected",
  "Rejected",
  "Withdrawn",
];

router.use(authMiddleware);

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function getId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getDescription(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.length > 5000) {
    return undefined;
  }
  return value.trim() || null;
}

async function findOwnedApplication(
  executor,
  applicationId,
  userId,
  lockForUpdate = false,
) {
  const [applications] = await executor.execute(
    `SELECT id, company_name, position, status, applied_date FROM applications
     WHERE id = ? AND user_id = ?${lockForUpdate ? " FOR UPDATE" : ""}`,
    [applicationId, userId],
  );
  return applications[0];
}

router.get("/", async (req, res) => {
  const [applications] = await db.execute(
    `SELECT id, company_name, position, career_page, application_link,
            applied_date, status, last_updated, next_date, notes, created_at
     FROM applications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.userId],
  );

  if (applications.length === 0) {
    return res.json({ applications });
  }

  const [events] = await db.execute(
    `SELECT ae.id, ae.application_id, ae.event_type, ae.event_date,
            ae.description, ae.created_at
     FROM application_events AS ae
     INNER JOIN applications AS app ON app.id = ae.application_id
     WHERE app.user_id = ?
     ORDER BY ae.event_date ASC, ae.id ASC`,
    [req.userId],
  );
  const eventsByApplication = new Map();
  for (const event of events) {
    const applicationEvents = eventsByApplication.get(event.application_id) || [];
    applicationEvents.push(event);
    eventsByApplication.set(event.application_id, applicationEvents);
  }

  return res.json({
    applications: applications.map((application) => ({
      ...application,
      events: eventsByApplication.get(application.id) || [],
    })),
  });
});

router.post("/", async (req, res) => {
  const companyName =
    typeof req.body?.company_name === "string"
      ? req.body.company_name.trim()
      : "";
  const position =
    typeof req.body?.position === "string"
      ? req.body.position.trim() || null
      : null;
  const status =
    typeof req.body?.status === "string" ? req.body.status : "Interested";
  const eventDate = req.body?.event_date;
  const description = getDescription(req.body?.description);

  if (!companyName || companyName.length > 150) {
    return res.status(400).json({
      message: "Company name is required (150 characters max).",
    });
  }
  if (position && position.length > 150) {
    return res.status(400).json({ message: "Position must be 150 characters max." });
  }
  if (!APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid application status." });
  }
  if (description === undefined) {
    return res.status(400).json({ message: "Step details must be 5000 characters max." });
  }
  if (status !== "Interested" && !isValidDate(eventDate)) {
    return res.status(400).json({ message: "Enter a valid date for this status." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const appliedDate = status === "Applied" ? eventDate : null;
    const [result] = await connection.execute(
      `INSERT INTO applications (user_id, company_name, position, status, applied_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, companyName, position, status, appliedDate],
    );

    let event = null;
    if (status !== "Interested") {
      const [eventResult] = await connection.execute(
        `INSERT INTO application_events (application_id, event_type, event_date, description)
         VALUES (?, ?, ?, ?)`,
        [result.insertId, status, eventDate, description],
      );
      event = {
        id: eventResult.insertId,
        application_id: result.insertId,
        event_type: status,
        event_date: eventDate,
        description,
      };
    }

    await connection.commit();
    const notification = await sendTelegramNotification(
      [
        "TrackMe - application saved",
        `Company: ${companyName}`,
        `Position: ${position || "Not specified"}`,
        `Status: ${status}`,
        ...(status !== "Interested" ? [`Date: ${eventDate}`] : []),
        ...(description ? [`Details: ${description}`] : []),
      ].join("\n"),
    );
    return res.status(201).json({
      application: {
        id: result.insertId,
        company_name: companyName,
        position,
        status,
        applied_date: appliedDate,
        events: event ? [event] : [],
      },
      notification,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.put("/:id", async (req, res) => {
  const applicationId = getId(req.params.id);
  const companyName =
    typeof req.body?.company_name === "string"
      ? req.body.company_name.trim()
      : "";
  const position =
    typeof req.body?.position === "string"
      ? req.body.position.trim() || null
      : null;

  if (!applicationId) {
    return res.status(400).json({ message: "Invalid application ID." });
  }
  if (!companyName || companyName.length > 150) {
    return res.status(400).json({
      message: "Company name is required (150 characters max).",
    });
  }
  if (position && position.length > 150) {
    return res.status(400).json({ message: "Position must be 150 characters max." });
  }

  const existingApplication = await findOwnedApplication(
    db,
    applicationId,
    req.userId,
  );
  if (!existingApplication) {
    return res.status(404).json({ message: "Application not found." });
  }

  await db.execute(
    "UPDATE applications SET company_name = ?, position = ? WHERE id = ? AND user_id = ?",
    [companyName, position, applicationId, req.userId],
  );
  return res.json({
    application: {
      id: applicationId,
      company_name: companyName,
      position,
    },
  });
});

router.delete("/:id", async (req, res) => {
  const applicationId = getId(req.params.id);
  if (!applicationId) {
    return res.status(400).json({ message: "Invalid application ID." });
  }

  const [result] = await db.execute(
    "DELETE FROM applications WHERE id = ? AND user_id = ?",
    [applicationId, req.userId],
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Application not found." });
  }

  return res.json({ message: "Application deleted." });
});

router.post("/:id/events", async (req, res) => {
  const applicationId = getId(req.params.id);
  const eventType =
    typeof req.body?.event_type === "string" ? req.body.event_type : "";
  const eventDate = req.body?.event_date;
  const description = getDescription(req.body?.description);

  if (!applicationId) {
    return res.status(400).json({ message: "Invalid application ID." });
  }
  if (!APPLICATION_STATUSES.includes(eventType)) {
    return res.status(400).json({ message: "Select a valid status for this step." });
  }
  if (!isValidDate(eventDate)) {
    return res.status(400).json({ message: "Enter a valid date for this step." });
  }
  if (description === undefined) {
    return res.status(400).json({ message: "Step details must be 5000 characters max." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const application = await findOwnedApplication(
      connection,
      applicationId,
      req.userId,
      true,
    );
    if (!application) {
      await connection.rollback();
      return res.status(404).json({ message: "Application not found." });
    }

    const [result] = await connection.execute(
      `INSERT INTO application_events (application_id, event_type, event_date, description)
       VALUES (?, ?, ?, ?)`,
      [applicationId, eventType, eventDate, description],
    );
    const appliedDate =
      eventType === "Applied" ? eventDate : application.applied_date;
    await connection.execute(
      "UPDATE applications SET status = ?, applied_date = ? WHERE id = ? AND user_id = ?",
      [eventType, appliedDate, applicationId, req.userId],
    );
    await connection.commit();

    const notification = await sendTelegramNotification(
      [
        "TrackMe - application progress update",
        `Company: ${application.company_name}`,
        `Position: ${application.position || "Not specified"}`,
        `Status: ${eventType}`,
        `Date: ${eventDate}`,
        ...(description ? [`Details: ${description}`] : []),
      ].join("\n"),
    );
    return res.status(201).json({
      event: {
        id: result.insertId,
        application_id: applicationId,
        event_type: eventType,
        event_date: eventDate,
        description,
      },
      status: eventType,
      applied_date: appliedDate,
      notification,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.put("/:id/events/:eventId", async (req, res) => {
  const applicationId = getId(req.params.id);
  const eventId = getId(req.params.eventId);
  const eventType =
    typeof req.body?.event_type === "string" ? req.body.event_type : "";
  const eventDate = req.body?.event_date;
  const description = getDescription(req.body?.description);

  if (!applicationId || !eventId) {
    return res.status(400).json({ message: "Invalid application or step ID." });
  }
  if (!APPLICATION_STATUSES.includes(eventType)) {
    return res.status(400).json({ message: "Select a valid status for this step." });
  }
  if (!isValidDate(eventDate)) {
    return res.status(400).json({ message: "Enter a valid date for this step." });
  }
  if (description === undefined) {
    return res.status(400).json({ message: "Step details must be 5000 characters max." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const application = await findOwnedApplication(
      connection,
      applicationId,
      req.userId,
      true,
    );
    if (!application) {
      await connection.rollback();
      return res.status(404).json({ message: "Application not found." });
    }

    const [events] = await connection.execute(
      `SELECT id FROM application_events
       WHERE id = ? AND application_id = ? FOR UPDATE`,
      [eventId, applicationId],
    );
    if (!events[0]) {
      await connection.rollback();
      return res.status(404).json({ message: "Application step not found." });
    }

    await connection.execute(
      `UPDATE application_events
       SET event_type = ?, event_date = ?, description = ?
       WHERE id = ? AND application_id = ?`,
      [eventType, eventDate, description, eventId, applicationId],
    );
    const [latestEvents] = await connection.execute(
      `SELECT id, event_type FROM application_events
       WHERE application_id = ? ORDER BY id DESC LIMIT 1`,
      [applicationId],
    );
    const [appliedEvents] = await connection.execute(
      `SELECT event_date FROM application_events
       WHERE application_id = ? AND event_type = 'Applied'
       ORDER BY id DESC LIMIT 1`,
      [applicationId],
    );
    const appliedDate =
      appliedEvents[0]?.event_date || application.applied_date;

    await connection.execute(
      `UPDATE applications
       SET status = ?, applied_date = ?
       WHERE id = ? AND user_id = ?`,
      [latestEvents[0].event_type, appliedDate, applicationId, req.userId],
    );
    await connection.commit();

    return res.json({
      event: {
        id: eventId,
        application_id: applicationId,
        event_type: eventType,
        event_date: eventDate,
        description,
      },
      status: latestEvents[0].event_type,
      applied_date: appliedDate,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = router;
