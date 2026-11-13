require("dotenv").config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin =
  process.env.FRONTEND_URL || "http://localhost:5173";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

authMiddleware.getJwtSecret();

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check could not reach MySQL:", error);
    res.status(503).json({
      status: "error",
      database: "unavailable",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({ message: "Internal server error." });
});

async function startServer() {
  await db.query("SELECT 1");
  app.listen(port, () => {
    console.log(`TrackMe API listening on port ${port}.`);
    console.log(`Allowed frontend origin: ${frontendOrigin}`);
  });
}

startServer().catch(async (error) => {
  console.error("Failed to start TrackMe API:", error);
  await db.end();
  process.exitCode = 1;
});
