import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadQuizzes() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.getQuizzes(token);
      setQuizzes(result.quizzes);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, [token]);

  function handleCreateRoom(quizId) {
    navigate(`/admin/rooms/new/${quizId}`);
  }

  return (
    <>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex min-h-56 flex-col p-5">
            <div className="flex-1">
              <div className="mb-4 inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600">
                {t("questionsCount", { count: quiz.questionCount })}
              </div>
              <h2 className="text-xl font-bold text-zinc-950">{quiz.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{quiz.description}</p>
            </div>
            <Button onClick={() => handleCreateRoom(quiz.id)} disabled={loading}>
              <Plus size={17} aria-hidden="true" />
              {t("createRoom")}
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
