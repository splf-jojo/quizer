import { AlertTriangle, ArrowLeft, CheckCircle2, Play, Square } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http.js";
import { createRoomSocket } from "../api/socket.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Timer from "../components/Timer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatDateTime } from "../utils/dateTime.js";

function statusMeta(status, t) {
  if (status === "STARTED") {
    return {
      label: t("liveQuiz")
    };
  }

  if (status === "FINISHED") {
    return {
      label: t("quizFinished")
    };
  }

  return {
    label: t("roomWaiting")
  };
}

function HostRoomHeader({ room, t }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/admin"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={t("back")}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-zinc-950">{room.quizTitle}</h1>
          </div>
        </div>
      </div>
    </header>
  );
}

function RoomAccessCard({ code, joinUrl }) {
  return (
    <Card className="p-8 md:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="font-mono text-7xl font-black tracking-normal text-zinc-950 sm:text-8xl">
          {code}
        </div>
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
          <QRCodeSVG value={joinUrl} size={184} marginSize={2} />
        </div>
      </div>
    </Card>
  );
}

function ParticipantsCard({ participants, t }) {
  const completedCount = participants.filter((participant) => participant.completed).length;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">{t("participants")}</h2>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">{t("noStudentsYet")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("noStudentsHelper")}</p>
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-auto pr-1">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {participant.displayName}
                </p>
                <p className="text-xs text-zinc-500">
                  {participant.completed ? t("completed") : t("joined")}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-bold ${
                  participant.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    participant.connected ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                  aria-hidden="true"
                />
                {participant.connected ? t("online") : t("offline")}
              </span>
            </div>
          ))}
        </div>
      )}

      {participants.length > 0 ? (
        <div className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          {t("progress")}: {completedCount} / {participants.length}
        </div>
      ) : null}
    </Card>
  );
}

function SessionStatusCard({ loading, onFinish, onStart, participants, room, t }) {
  const meta = statusMeta(room.status, t);
  const completedCount = participants.filter((participant) => participant.completed).length;

  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold text-zinc-950">
        {t("sessionStatus")}: {meta.label}
      </h2>
      <div className="mt-4 space-y-4">
        {room.status === "WAITING" && room.startsAt ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-zinc-500">{t("scheduledFor")}</span>
            <div className="text-right text-sm font-semibold text-zinc-900">
              <div>{formatDateTime(room.startsAt)}</div>
              <div className="mt-1">
                <Timer targetTime={room.startsAt} serverTime={room.serverTime} label={t("start")} />
              </div>
            </div>
          </div>
        ) : null}

        {room.status === "STARTED" ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-zinc-500">{t("endsAtLabel")}</span>
            <div className="text-right text-sm font-semibold text-zinc-900">
              <div>{formatDateTime(room.endsAt)}</div>
              <div className="mt-1">
                <Timer targetTime={room.endsAt} serverTime={room.serverTime} label={t("finish")} />
              </div>
            </div>
          </div>
        ) : null}

        {room.status === "FINISHED" ? (
          <div className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <CheckCircle2 size={17} aria-hidden="true" />
              {t("finalStatus")}
            </div>
            <p className="mt-1">{t("finishedHelper")}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-zinc-50 px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-normal text-zinc-500">{t("joined")}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">{participants.length}</p>
          </div>
          <div className="rounded-md bg-zinc-50 px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-normal text-zinc-500">
              {t("completed")}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">{completedCount}</p>
          </div>
        </div>

        {room.status === "WAITING" ? (
          <Button className="w-full" onClick={onStart} disabled={loading}>
            <Play size={17} aria-hidden="true" />
            {t("startQuiz")}
          </Button>
        ) : null}
        {room.status === "STARTED" ? (
          <Button className="w-full" variant="danger" onClick={onFinish} disabled={loading}>
            <Square size={16} aria-hidden="true" />
            {t("finishQuiz")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function ConfirmFinishDialog({ onCancel, onConfirm, t }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4">
      <div
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-dialog-title"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 id="finish-dialog-title" className="text-lg font-bold text-zinc-950">
              {t("finishConfirmTitle")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{t("finishConfirmText")}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {t("keepLive")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t("confirmFinish")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const joinUrl = useMemo(() => {
    const publicUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, "");
    return `${publicUrl}/room/${code}`;
  }, [code]);

  async function loadRoom() {
    setError("");
    try {
      const [roomResult, participantsResult] = await Promise.all([
        api.getRoom(code),
        api.getParticipants(code)
      ]);
      setRoom(roomResult);
      setParticipants(participantsResult.participants);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/admin", { replace: true });
      return undefined;
    }

    loadRoom();
    const socket = createRoomSocket({ roomCode: code, token });

    socket.on("ROOM_STATE", (payload) => {
      setRoom(payload);
    });
    socket.on("ROOM_SETTINGS_UPDATED", (payload) => {
      setRoom(payload);
    });
    socket.on("PARTICIPANTS_UPDATED", (payload) => {
      setParticipants(payload.participants || []);
    });
    socket.on("connect_error", (socketError) => {
      setError(socketError.message);
    });

    return () => socket.close();
  }, [code, navigate, token]);

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const result = await api.startRoom(code, token);
      setRoom(result.room);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const result = await api.finishRoom(code, token);
      setRoom(result.room);
      setConfirmFinish(false);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!room) {
    return (
      <main className="page-shell grid min-h-screen place-items-center px-4 text-sm text-zinc-600">
        {error || t("loadingRoom")}
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen">
      <HostRoomHeader room={room} t={t} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <RoomAccessCard code={code} joinUrl={joinUrl} />
          <ParticipantsCard participants={participants} t={t} />
        </section>

        <aside className="space-y-6">
          <SessionStatusCard
            loading={loading}
            onFinish={() => setConfirmFinish(true)}
            onStart={handleStart}
            participants={participants}
            room={room}
            t={t}
          />
        </aside>
      </div>

      {confirmFinish ? (
        <ConfirmFinishDialog
          onCancel={() => setConfirmFinish(false)}
          onConfirm={handleFinish}
          t={t}
        />
      ) : null}
    </main>
  );
}
