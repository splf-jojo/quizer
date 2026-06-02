import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Eye,
  Globe2,
  ListChecks,
  RotateCcw
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http.js";
import Card from "../components/Card.jsx";
import QuizSettingsCard, {
  createSettingsPayload,
  createSettingsState
} from "../components/QuizSettingsCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

function formatLocalDateTime(value, locale, t) {
  if (!value) {
    return t("notSet");
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTimezone(timezone) {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");

  return `${timezone} (UTC${sign}${hours}:${minutes})`;
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 shrink-0 text-zinc-500" size={18} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium leading-5 text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function RoomSummaryCard({ locale, quiz, settings, t, timezone }) {
  const questionCount = quiz.questions?.length || quiz.questionCount || 0;
  const yes = t("yes");
  const no = t("no");

  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <h2 className="text-base font-bold text-zinc-950">{t("roomSummary")}</h2>
      <div className="mt-5 space-y-4">
        <SummaryItem icon={ListChecks} label={t("questionsSummary")} value={questionCount} />
        <SummaryItem
          icon={Clock}
          label={t("duration")}
          value={`${settings.durationMinutes || 0} ${t("minutes")}`}
        />
        <SummaryItem icon={Globe2} label={t("timezone")} value={formatTimezone(timezone)} />
        <SummaryItem
          icon={Eye}
          label={t("showAnswersSummary")}
          value={settings.showCorrectAnswers ? yes : no}
        />
        <SummaryItem
          icon={RotateCcw}
          label={t("backNavigationSummary")}
          value={settings.allowBackNavigation ? yes : no}
        />
        <SummaryItem
          icon={CalendarDays}
          label={t("start")}
          value={formatLocalDateTime(settings.startsAt, locale, t)}
        />
        <SummaryItem
          icon={CalendarDays}
          label={t("finish")}
          value={formatLocalDateTime(settings.endsAt, locale, t)}
        />
      </div>
    </Card>
  );
}

export default function AdminRoomSetupPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const [quiz, setQuiz] = useState(null);
  const [settings, setSettings] = useState(() => createSettingsState());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/admin", { replace: true });
      return undefined;
    }

    let active = true;
    setError("");

    api
      .getQuiz(quizId, token)
      .then((result) => {
        if (active) {
          setQuiz(result.quiz);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError.message);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, quizId, token]);

  async function handleCreateRoom(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await api.createRoom(
        {
          quizId,
          ...createSettingsPayload(settings)
        },
        token
      );
      navigate(`/admin/rooms/${result.room.code}`);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/admin"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={t("back")}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-bold text-zinc-950">
                {quiz?.title || t("loadingRoom")}
              </h1>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {quiz ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div>
              <QuizSettingsCard
                actionDisabled={loading}
                actionLabel={t("createConfiguredRoom")}
                locked={false}
                onSubmit={handleCreateRoom}
                settings={settings}
                settingsDirty
                setSettings={setSettings}
                showNoChangesHint={false}
                t={t}
              />
            </div>
            <RoomSummaryCard
              locale={locale}
              quiz={quiz}
              settings={settings}
              t={t}
              timezone={timezone}
            />
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-zinc-600">
            {error || t("loadingRoom")}
          </Card>
        )}
      </div>
    </main>
  );
}
