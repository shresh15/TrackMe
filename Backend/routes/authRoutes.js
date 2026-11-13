const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const COOKIE_NAME = authMiddleware.COOKIE_NAME;
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24;
const BCRYPT_ROUNDS = 12;

function setAuthCookie(res, userId) {
  const token = jwt.sign({}, authMiddleware.getJwtSecret(), {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: TOKEN_LIFETIME_SECONDS,
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_LIFETIME_SECONDS * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

router.post("/register", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || name.length > 255) {
    return res.status(400).json({ message: "Name is required (255 characters max)." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      message: "Password must be at least 8 characters and no more than 72 bytes.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, passwordHash],
    );

    setAuthCookie(res, result.insertId);
    return res.status(201).json({
      user: { id: result.insertId, name, email },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const [users] = await db.execute(
    "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const user = users[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  setAuthCookie(res, user.id);
  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.get("/me", authMiddleware, async (req, res) => {
  const [users] = await db.execute(
    "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
    [req.userId],
  );
  const user = users[0];
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "User account no longer exists." });
  }
  return res.json({ user });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out." });
});

module.exports = router;
