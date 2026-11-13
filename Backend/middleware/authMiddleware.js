const jwt = require("jsonwebtoken");

const COOKIE_NAME = "trackme_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 bytes.");
  }
  return secret;
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.userId = userId;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Invalid or expired authentication token." });
    }
    return next(error);
  }
}

authMiddleware.COOKIE_NAME = COOKIE_NAME;
authMiddleware.getJwtSecret = getJwtSecret;

module.exports = authMiddleware;
