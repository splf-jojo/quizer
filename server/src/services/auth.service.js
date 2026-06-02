import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_later";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role
  };
}

export async function loginAdmin(email, password) {
  if (!email || !password) {
    throw httpError(400, "Email and password are required");
  }

  const { rows } = await query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE email = $1 AND role = 'ADMIN'`,
    [email]
  );

  const user = rows[0];
  if (!user || user.password_hash !== hashPassword(password)) {
    throw httpError(401, "Invalid email or password");
  }

  const publicUser = mapUser(user);
  const token = jwt.sign(
    {
      sub: user.id,
      id: user.id,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  return {
    token,
    user: publicUser
  };
}
