import jwt from "jsonwebtoken";
import { httpError } from "../utils/httpError.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_later";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    next(httpError(401, "Authorization token is required"));
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(httpError(401, "Invalid authorization token"));
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    next(httpError(403, "Admin access is required"));
    return;
  }

  next();
}
