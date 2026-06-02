import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/http.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "quizzer_admin_auth";

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  async function login(email, password) {
    const result = await api.login({ email, password });
    const nextAuth = {
      token: result.token,
      user: result.user
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    return nextAuth;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  const value = useMemo(
    () => ({
      auth,
      token: auth?.token || null,
      user: auth?.user || null,
      isAdmin: auth?.user?.role === "ADMIN",
      login,
      logout
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
