import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

const statuses = [
  "Interested",
  "Applied",
  "OA/Test",
  "Interview",
  "Selected",
  "Rejected",
  "Withdrawn",
];
const inputClass =
  "mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-green-400";
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  .toISOString()
  .slice(0, 10);

function dateValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function sortEvents(events) {
  return [...events].sort(
    (first, second) =>
      dateValue(first.event_date).localeCompare(dateValue(second.event_date)) ||
      first.id - second.id,
  );
}

function nextStatus(currentStatus) {
  const nextStatuses = {
    Interested: "Applied",
    Applied: "OA/Test",
    "OA/Test": "Interview",
    Interview: "Selected",
  };
  return nextStatuses[currentStatus] || "Interview";
}

function AnalysisDashboard({ applications, isLoading }) {
  const totalApplications = applications.length;
  const inProgressCount = applications.filter(
    ({ status }) => !["Selected", "Rejected", "Withdrawn"].includes(status),
  ).length;
  const interviewCount = applications.filter(
    ({ status }) => status === "Interview",
  ).length;
  const offerCount = applications.filter(
    ({ status }) => status === "Selected",
  ).length;
  const statusCounts = statuses.map((applicationStatus) => ({
    status: applicationStatus,
    count: applications.filter(
      (application) => application.status === applicationStatus,
    ).length,
  }));
  const metrics = [
    { label: "Total applications", value: totalApplications },
    { label: "In progress", value: inProgressCount },
    { label: "Interviews", value: interviewCount },
    { label: "Offers", value: offerCount },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-bold uppercase tracking-widest text-green-400">
        Overview
      </p>
      <h2 className="mt-2 text-2xl font-bold">Analysis dashboard</h2>
      <p className="mt-2 text-sm text-gray-400">
        A snapshot of your job search progress.
      </p>
      {isLoading ? (
        <p className="mt-6 text-sm text-gray-400">Loading analysis...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article
                className="rounded-xl border border-white/10 bg-black/30 p-5"
                key={metric.label}
              >
                <p className="text-sm text-gray-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {metric.value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-5">
            <h3 className="font-semibold">Applications by status</h3>
            {totalApplications === 0 ? (
              <p className="mt-3 text-sm text-gray-400">
                Add an application to see your status breakdown.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {statusCounts.map(({ status, count }) => (
                  <li key={status}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-300">{status}</span>
                      <span className="text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-green-400"
                        style={{
                          width: `${(count / totalApplications) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Applications({ user }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isDayMode, setIsDayMode] = useState(false);
  const [activeView, setActiveView] = useState("applications");
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("Interested");
  const [statusDate, setStatusDate] = useState(today);
  const [statusDescription, setStatusDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [addingStepApplicationId, setAddingStepApplicationId] = useState(null);
  const [stepStatus, setStepStatus] = useState("Applied");
  const [stepDate, setStepDate] = useState(today);
  const [stepDescription, setStepDescription] = useState("");
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    let active = true;

    apiRequest("/applications")
      .then(({ applications: userApplications }) => {
        if (active) {
          setApplications(userApplications);
        }
      })
      .catch((requestError) => {
        if (active && requestError.status === 401) {
          navigate("/login", { replace: true });
        } else if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice(null);
    setIsSubmitting(true);

    try {
      const { application, notification } = await apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify({
          company_name: companyName,
          position,
          status,
          event_date: statusDate,
          description: statusDescription,
        }),
      });
      setApplications((currentApplications) => [
        application,
        ...currentApplications,
      ]);
      setCompanyName("");
      setPosition("");
      setStatus("Interested");
      setStatusDate(today);
      setStatusDescription("");
      setNotice({
        type: notification?.sent ? "success" : "warning",
        message: notification?.message || "Application saved.",
      });
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError(requestError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteApplication(application) {
    const confirmed = window.confirm(
      `Delete the application for ${application.company_name}? Its progress history will also be deleted. This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setNotice(null);
    try {
      await apiRequest(`/applications/${application.id}`, {
        method: "DELETE",
      });
      setApplications((currentApplications) =>
        currentApplications.filter((item) => item.id !== application.id),
      );
      setNotice({
        type: "success",
        message: "Application deleted.",
      });
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError(requestError.message);
      }
    }
  }

  function beginEdit(application) {
    setEditingApplicationId(application.id);
    setEditCompanyName(application.company_name);
    setEditPosition(application.position || "");
    setAddingStepApplicationId(null);
    setEditingEvent(null);
    setError("");
  }

  async function handleEditApplication(event, applicationId) {
    event.preventDefault();
    setError("");
    setNotice(null);

    try {
      const { application } = await apiRequest(
        `/applications/${applicationId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            company_name: editCompanyName,
            position: editPosition,
          }),
        },
      );
      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === applicationId ? { ...item, ...application } : item,
        ),
      );
      setEditingApplicationId(null);
      setNotice({ type: "success", message: "Application details updated." });
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError(requestError.message);
      }
    }
  }

  function beginAddStep(application) {
    setAddingStepApplicationId(application.id);
    setStepStatus(nextStatus(application.status));
    setStepDate(today);
    setStepDescription("");
    setEditingApplicationId(null);
    setEditingEvent(null);
    setError("");
  }

  async function handleAddStep(event, applicationId) {
    event.preventDefault();
    setError("");
    setNotice(null);

    try {
      const result = await apiRequest(`/applications/${applicationId}/events`, {
        method: "POST",
        body: JSON.stringify({
          event_type: stepStatus,
          event_date: stepDate,
          description: stepDescription,
        }),
      });
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: result.status,
                applied_date: result.applied_date,
                events: sortEvents([...application.events, result.event]),
              }
            : application,
        ),
      );
      setAddingStepApplicationId(null);
      setNotice({
        type: result.notification?.sent ? "success" : "warning",
        message: result.notification?.message || "Progress step saved.",
      });
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError(requestError.message);
      }
    }
  }

  function beginEditEvent(applicationId, event) {
    setEditingEvent({
      applicationId,
      id: event.id,
      event_type: event.event_type,
      event_date: dateValue(event.event_date),
      description: event.description || "",
    });
    setAddingStepApplicationId(null);
    setEditingApplicationId(null);
    setError("");
  }

  async function handleEditEvent(event) {
    event.preventDefault();
    setError("");
    setNotice(null);

    try {
      const result = await apiRequest(
        `/applications/${editingEvent.applicationId}/events/${editingEvent.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            event_type: editingEvent.event_type,
            event_date: editingEvent.event_date,
            description: editingEvent.description,
          }),
        },
      );
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === editingEvent.applicationId
            ? {
                ...application,
                status: result.status,
                applied_date: result.applied_date,
                events: sortEvents(
                  application.events.map((item) =>
                    item.id === editingEvent.id ? result.event : item,
                  ),
                ),
              }
            : application,
        ),
      );
      setEditingEvent(null);
      setNotice({ type: "success", message: "Progress step updated." });
    } catch (requestError) {
      if (requestError.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setError(requestError.message);
      }
    }
  }

  async function handleLogout() {
    setError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main
      className={`min-h-screen px-4 py-10 transition-colors sm:px-8 ${
        isDayMode
          ? "applications-day-mode bg-green-100 text-green-950"
          : "bg-black text-white"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-400">
              TrackMe
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              {activeView === "analysis"
                ? "Analysis dashboard"
                : "Your applications"}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Signed in as {user.name} ({user.email})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-pressed={isDayMode}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-green-400 hover:text-green-300"
              onClick={() => setIsDayMode((currentMode) => !currentMode)}
              type="button"
            >
              {isDayMode ? "Switch to night mode" : "Switch to day mode"}
            </button>
            <button
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-green-400 hover:text-green-300"
              onClick={handleLogout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-4 lg:sticky lg:top-8">
            <p className="px-3 pb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
              Workspace
            </p>
            <nav aria-label="Dashboard navigation" className="space-y-2">
              <button
                aria-current={
                  activeView === "applications" ? "page" : undefined
                }
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeView === "applications"
                    ? "bg-green-400/10 text-green-300"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setActiveView("applications")}
                type="button"
              >
                Applications
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {isLoading ? "—" : applications.length}
                </span>
              </button>
              <button
                aria-current={activeView === "analysis" ? "page" : undefined}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeView === "analysis"
                    ? "bg-green-400/10 text-green-300"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setActiveView("analysis")}
                type="button"
              >
                Analysis Dashboard
              </button>
            </nav>
          </aside>

          <div className="min-w-0">
            {error && (
              <p
                className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  notice.type === "success"
                    ? "border-green-400/30 bg-green-400/10 text-green-200"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-100"
                }`}
                role="status"
              >
                {notice.message}
              </p>
            )}

            {activeView === "analysis" ? (
              <AnalysisDashboard
                applications={applications}
                isLoading={isLoading}
              />
            ) : (
              <>
                <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-xl font-semibold">Add an application</h2>
                  <form
                    className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={handleSubmit}
                  >
                    <label className="text-sm text-gray-300">
                      Company
                      <input
                        className={inputClass}
                        maxLength={150}
                        onChange={(event) => setCompanyName(event.target.value)}
                        required
                        value={companyName}
                      />
                    </label>
                    <label className="text-sm text-gray-300">
                      Position
                      <input
                        className={inputClass}
                        maxLength={150}
                        onChange={(event) => setPosition(event.target.value)}
                        value={position}
                      />
                    </label>
                    <label className="text-sm text-gray-300">
                      Status
                      <select
                        className={inputClass}
                        onChange={(event) => setStatus(event.target.value)}
                        value={status}
                      >
                        {statuses.map((applicationStatus) => (
                          <option
                            key={applicationStatus}
                            value={applicationStatus}
                          >
                            {applicationStatus}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <button
                        className="w-full rounded-lg bg-green-400 px-4 py-2.5 font-bold text-black transition hover:bg-green-300 disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? "Saving..." : "Add application"}
                      </button>
                    </div>
                    {status !== "Interested" && (
                      <>
                        <label className="text-sm text-gray-300">
                          {status} date
                          <input
                            className={inputClass}
                            onChange={(event) =>
                              setStatusDate(event.target.value)
                            }
                            required
                            type="date"
                            value={statusDate}
                          />
                        </label>
                        <label className="text-sm text-gray-300 sm:col-span-2">
                          Step details (optional)
                          <input
                            className={inputClass}
                            maxLength={5000}
                            onChange={(event) =>
                              setStatusDescription(event.target.value)
                            }
                            value={statusDescription}
                          />
                        </label>
                      </>
                    )}
                  </form>
                </section>

                <section className="mt-9">
                  <h2 className="text-xl font-semibold">Recent applications</h2>
                  {isLoading ? (
                    <p className="mt-4 text-gray-400">
                      Loading applications...
                    </p>
                  ) : applications.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-white/15 px-5 py-8 text-center text-gray-400">
                      No applications yet. Add one above to get started.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {applications.map((application) => (
                        <li
                          className="rounded-xl border border-white/10 bg-white/5 p-5"
                          key={application.id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">
                                {application.company_name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-400">
                                {application.position ||
                                  "Position not specified"}
                              </p>
                              {application.applied_date && (
                                <p className="mt-2 text-xs text-gray-400">
                                  Applied {dateValue(application.applied_date)}
                                </p>
                              )}
                            </div>
                            <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs font-medium text-green-300">
                              {application.status}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200 hover:border-green-400 hover:text-green-300"
                              onClick={() => beginEdit(application)}
                              type="button"
                            >
                              Edit application
                            </button>
                            <button
                              className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"
                              onClick={() =>
                                handleDeleteApplication(application)
                              }
                              type="button"
                            >
                              Delete
                            </button>
                            <button
                              className="rounded-lg border border-green-400/40 px-3 py-2 text-sm text-green-300 hover:bg-green-400/10"
                              onClick={() => beginAddStep(application)}
                              type="button"
                            >
                              Add next step
                            </button>
                            <button
                              aria-expanded={
                                expandedApplicationId === application.id
                              }
                              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200 hover:border-white/30"
                              onClick={() =>
                                setExpandedApplicationId(
                                  expandedApplicationId === application.id
                                    ? null
                                    : application.id,
                                )
                              }
                              type="button"
                            >
                              {expandedApplicationId === application.id
                                ? "Hide history"
                                : `Step history (${application.events.length})`}
                            </button>
                          </div>

                          {editingApplicationId === application.id && (
                            <form
                              className="mt-4 grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-3"
                              onSubmit={(event) =>
                                handleEditApplication(event, application.id)
                              }
                            >
                              <label className="text-sm text-gray-300">
                                Company
                                <input
                                  className={inputClass}
                                  maxLength={150}
                                  onChange={(event) =>
                                    setEditCompanyName(event.target.value)
                                  }
                                  required
                                  value={editCompanyName}
                                />
                              </label>
                              <label className="text-sm text-gray-300">
                                Position
                                <input
                                  className={inputClass}
                                  maxLength={150}
                                  onChange={(event) =>
                                    setEditPosition(event.target.value)
                                  }
                                  value={editPosition}
                                />
                              </label>
                              <div className="flex items-end gap-2">
                                <button
                                  className="rounded-lg bg-green-400 px-4 py-2.5 font-semibold text-black hover:bg-green-300"
                                  type="submit"
                                >
                                  Save
                                </button>
                                <button
                                  className="rounded-lg border border-white/15 px-4 py-2.5"
                                  onClick={() => setEditingApplicationId(null)}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {addingStepApplicationId === application.id && (
                            <form
                              className="mt-4 grid gap-3 rounded-lg border border-green-400/20 bg-green-400/5 p-4 sm:grid-cols-4"
                              onSubmit={(event) =>
                                handleAddStep(event, application.id)
                              }
                            >
                              <label className="text-sm text-gray-300">
                                New status
                                <select
                                  className={inputClass}
                                  onChange={(event) =>
                                    setStepStatus(event.target.value)
                                  }
                                  value={stepStatus}
                                >
                                  {statuses.map((applicationStatus) => (
                                    <option
                                      key={applicationStatus}
                                      value={applicationStatus}
                                    >
                                      {applicationStatus}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="text-sm text-gray-300">
                                Date
                                <input
                                  className={inputClass}
                                  onChange={(event) =>
                                    setStepDate(event.target.value)
                                  }
                                  required
                                  type="date"
                                  value={stepDate}
                                />
                              </label>
                              <label className="text-sm text-gray-300 sm:col-span-2">
                                Details (optional)
                                <input
                                  className={inputClass}
                                  maxLength={5000}
                                  onChange={(event) =>
                                    setStepDescription(event.target.value)
                                  }
                                  value={stepDescription}
                                />
                              </label>
                              <div className="flex gap-2 sm:col-span-4">
                                <button
                                  className="rounded-lg bg-green-400 px-4 py-2.5 font-semibold text-black hover:bg-green-300"
                                  type="submit"
                                >
                                  Save step
                                </button>
                                <button
                                  className="rounded-lg border border-white/15 px-4 py-2.5"
                                  onClick={() =>
                                    setAddingStepApplicationId(null)
                                  }
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {expandedApplicationId === application.id && (
                            <div className="mt-5 border-t border-white/10 pt-4">
                              <h4 className="text-sm font-semibold text-gray-200">
                                Progress history
                              </h4>
                              {application.events.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-400">
                                  No dated steps yet.
                                </p>
                              ) : (
                                <ol className="mt-3 space-y-3">
                                  {application.events.map((item) => (
                                    <li
                                      className="border-l-2 border-green-400/40 pl-4"
                                      key={item.id}
                                    >
                                      {editingEvent?.id === item.id ? (
                                        <form
                                          className="grid gap-3 sm:grid-cols-3"
                                          onSubmit={handleEditEvent}
                                        >
                                          <label className="text-sm text-gray-300">
                                            Status
                                            <select
                                              className={inputClass}
                                              onChange={(event) =>
                                                setEditingEvent({
                                                  ...editingEvent,
                                                  event_type:
                                                    event.target.value,
                                                })
                                              }
                                              value={editingEvent.event_type}
                                            >
                                              {statuses.map(
                                                (applicationStatus) => (
                                                  <option
                                                    key={applicationStatus}
                                                    value={applicationStatus}
                                                  >
                                                    {applicationStatus}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                          </label>
                                          <label className="text-sm text-gray-300">
                                            Date
                                            <input
                                              className={inputClass}
                                              onChange={(event) =>
                                                setEditingEvent({
                                                  ...editingEvent,
                                                  event_date:
                                                    event.target.value,
                                                })
                                              }
                                              required
                                              type="date"
                                              value={editingEvent.event_date}
                                            />
                                          </label>
                                          <label className="text-sm text-gray-300">
                                            Details
                                            <input
                                              className={inputClass}
                                              maxLength={5000}
                                              onChange={(event) =>
                                                setEditingEvent({
                                                  ...editingEvent,
                                                  description:
                                                    event.target.value,
                                                })
                                              }
                                              value={editingEvent.description}
                                            />
                                          </label>
                                          <div className="flex gap-2 sm:col-span-3">
                                            <button
                                              className="rounded-lg bg-green-400 px-4 py-2 font-semibold text-black hover:bg-green-300"
                                              type="submit"
                                            >
                                              Save step
                                            </button>
                                            <button
                                              className="rounded-lg border border-white/15 px-4 py-2"
                                              onClick={() =>
                                                setEditingEvent(null)
                                              }
                                              type="button"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </form>
                                      ) : (
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-medium">
                                              {item.event_type}
                                              <span className="ml-2 text-xs font-normal text-gray-400">
                                                {dateValue(item.event_date)}
                                              </span>
                                            </p>
                                            {item.description && (
                                              <p className="mt-1 text-sm text-gray-400">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            className="text-xs text-green-300 hover:text-green-200"
                                            onClick={() =>
                                              beginEditEvent(
                                                application.id,
                                                item,
                                              )
                                            }
                                            type="button"
                                          >
                                            Edit step
                                          </button>
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Applications;
