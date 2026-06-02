import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-950">Quizzer Admin</h1>
          <p className="mt-2 text-sm text-zinc-600">{t("adminSignInSubtitle")}</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm font-semibold text-zinc-800">
            {t("email")}
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-800">
            {t("password")}
            <input
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {t("signIn")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
