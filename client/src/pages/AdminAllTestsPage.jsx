import { CalendarDays, Clock, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/http.js";
import Card from "../components/Card.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { StatusBadge } from "../utils/status.jsx";

function roomBucket(room) {
  if (room.status === "STARTED") {
    return "active";
  }

  if (room.status === "FINISHED" || room.status === "CANCELLED") {
    return "completed";
  }

  return "planned";
}

function formatDateTime(value, locale, t) {
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

function formatDuration(seconds, t) {
  return `${Math.max(1, Math.round((seconds || 0) / 60))} ${t("minutes")}`;
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-10 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        active
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

function TestRow({ locale, room, t }) {
  return (
    <div className="grid gap-4 border-b border-zinc-200 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-bold text-zinc-950">{room.quizTitle}</h2>
          <StatusBadge status={room.status} />
        </div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-800 md:grid-cols-2 xl:grid-cols-4">
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
            <span className="truncate">{formatDateTime(room.startsAt, locale, t)}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <Clock size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
            <span>{formatDuration(room.durationSeconds, t)}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <Users size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
            <span>
              {room.completedCount}/{room.participantCount}
            </span>
          </span>
          <span className="truncate font-medium text-zinc-700">{room.code}</span>
        </div>
      </div>
      <Link
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        to={`/admin/rooms/${room.code}`}
      >
        {t("openTest")}
      </Link>
    </div>
  );
}

export default function AdminAllTestsPage() {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    active: true,
    planned: false,
    completed: false
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    api
      .getRooms(token)
      .then((result) => {
        if (mounted) {
          setRooms(result.rooms);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const visibleRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rooms.filter((room) => {
      if (!filters[roomBucket(room)]) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [room.quizTitle, room.quizDescription, room.code, t(`status_${room.status}`)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [filters, query, rooms, t]);

  function toggleFilter(key) {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
          aria-hidden="true"
        />
        <input
          className="h-11 w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type="search"
          value={query}
          placeholder={t("searchTests")}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterButton active={filters.active} onClick={() => toggleFilter("active")}>
          {t("activeTests")}
        </FilterButton>
        <FilterButton active={filters.planned} onClick={() => toggleFilter("planned")}>
          {t("plannedTests")}
        </FilterButton>
        <FilterButton active={filters.completed} onClick={() => toggleFilter("completed")}>
          {t("completedTests")}
        </FilterButton>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {visibleRooms.length > 0 ? (
          visibleRooms.map((room) => (
            <TestRow key={room.id} locale={locale} room={room} t={t} />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm font-medium text-zinc-700">
            {loading ? t("loadingTests") : t("noTestsFound")}
          </div>
        )}
      </Card>
    </div>
  );
}
