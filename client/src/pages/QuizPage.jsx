import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http.js";
import { createRoomSocket } from "../api/socket.js";
import Button from "../components/Button.jsx";
import QuizQuestion from "../components/QuizQuestion.jsx";
import Timer from "../components/Timer.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useRoomStore } from "../context/RoomContext.jsx";

export default function QuizPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { clearParticipant, getParticipant, saveParticipant, saveResult } = useRoomStore();
  const { t } = useLanguage();
  const [participant, setParticipant] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);
  const totalQuestions = quiz?.questions?.length || 0;
  const canSubmit = totalQuestions > 0 && selectedCount === totalQuestions && !submitting;
  const currentQuestion = quiz?.questions?.[currentIndex] || null;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentQuestionAnswered = currentQuestion ? Boolean(selected[currentQuestion.id]) : false;
  const allowBackNavigation = Boolean(quiz?.allowBackNavigation);

  useEffect(() => {
    const storedParticipant = getParticipant(code);
    if (!storedParticipant) {
      navigate(`/room/${code}`, { replace: true });
      return undefined;
    }

    setParticipant(storedParticipant);
    let active = true;

    Promise.all([api.joinRoom(code, { participantId: storedParticipant.id }), api.getRoomQuiz(code)])
      .then(([joinResult, result]) => {
        if (active) {
          setParticipant(joinResult.participant);
          saveParticipant(code, joinResult.participant);

          if (joinResult.participant.completed) {
            navigate(`/room/${code}/result`, { replace: true });
            return;
          }

          setQuiz(result);
          setCurrentIndex(0);
        }
      })
      .catch(async (nextError) => {
        if (!active) {
          return;
        }

        setError(nextError.message);
        if (nextError.message.includes("displayName")) {
          clearParticipant(code);
          navigate(`/room/${code}`, { replace: true });
          return;
        }

        try {
          const room = await api.getRoom(code);
          if (room.status === "WAITING") {
            navigate(`/room/${code}/waiting`, { replace: true });
          }
          if (room.status === "FINISHED") {
            navigate(`/room/${code}/result`, { replace: true });
          }
        } catch {
          setError(nextError.message);
        }
      });

    const socket = createRoomSocket({ roomCode: code, participantId: storedParticipant.id });
    socket.on("ROOM_STATE", (payload) => {
      if (payload.status === "WAITING") {
        navigate(`/room/${code}/waiting`, { replace: true });
      }
      if (payload.status === "FINISHED") {
        navigate(`/room/${code}/result`, { replace: true });
      }
    });
    socket.on("ROOM_FINISHED", () => {
      navigate(`/room/${code}/result`, { replace: true });
    });
    socket.on("connect_error", (socketError) => {
      setError(socketError.message);
    });

    return () => {
      active = false;
      socket.close();
    };
  }, [clearParticipant, code, getParticipant, navigate, saveParticipant]);

  function handleSelect(questionId, optionId) {
    setSelected((current) => ({
      ...current,
      [questionId]: optionId
    }));
  }

  const handleTimerEnd = useCallback(() => {
    navigate(`/room/${code}/result`, { replace: true });
  }, [code, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!participant) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await api.submitAnswers(code, {
        participantId: participant.id,
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: selected[question.id]
        }))
      });
      saveResult(code, result);
      navigate(`/room/${code}/result`, { replace: true });
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz) {
    return (
      <main className="page-shell grid min-h-screen place-items-center px-4 text-sm text-zinc-600">
        {error || t("loadingQuiz")}
      </main>
    );
  }

  const progressWidth =
    totalQuestions > 0 ? `${((currentIndex + 1) / totalQuestions) * 100}%` : "0%";

  function handlePrevious() {
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  function handleNext() {
    if (!currentQuestionAnswered) {
      return;
    }

    setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1));
  }

  return (
    <main className="page-shell min-h-screen px-4 py-4">
      <form
        onSubmit={handleSubmit}
        className="quiz-phone mx-auto flex flex-col rounded-lg border border-zinc-200 bg-white shadow-panel"
      >
        <header className="shrink-0 border-b border-zinc-200">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-zinc-950">{quiz.title}</h1>
              <p className="text-xs font-semibold text-violet-700">
                {t("answeredProgress", { count: selectedCount, total: totalQuestions })}
              </p>
            </div>
            <Timer
              targetTime={quiz.endsAt}
              serverTime={quiz.serverTime}
              label="Finish"
              onEnd={handleTimerEnd}
            />
          </div>
          <div className="h-1.5 bg-zinc-100">
            <div className="h-full bg-violet-700 transition-all" style={{ width: progressWidth }} />
          </div>
        </header>

        <div className="flex-1 overflow-auto px-5 py-5">
          <div className="space-y-8">
            {currentQuestion ? (
              <QuizQuestion
                key={currentQuestion.id}
                question={currentQuestion}
                current={currentIndex + 1}
                total={totalQuestions}
                selectedOptionId={selected[currentQuestion.id]}
                onSelect={handleSelect}
              />
            ) : null}
          </div>
          {error ? <p className="mt-5 text-sm font-medium text-red-600">{error}</p> : null}
        </div>

        <div
          className={`grid shrink-0 gap-3 border-t border-zinc-100 p-5 ${
            allowBackNavigation ? "grid-cols-2" : ""
          }`}
        >
          {allowBackNavigation && (
            <Button
              className="w-full"
              variant="secondary"
              size="lg"
              disabled={currentIndex === 0 || submitting}
              onClick={handlePrevious}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              {t("back")}
            </Button>
          )}
          {isLastQuestion ? (
            <Button className="w-full" type="submit" size="lg" disabled={!canSubmit}>
              {t("submit")}
              <Send size={17} aria-hidden="true" />
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              disabled={!currentQuestionAnswered || submitting}
              onClick={handleNext}
            >
              {t("next")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
