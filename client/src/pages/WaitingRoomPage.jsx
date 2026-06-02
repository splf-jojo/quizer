import { ArrowLeft, Clock, Edit3, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http.js";
import { createRoomSocket } from "../api/socket.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import ParticipantList from "../components/ParticipantList.jsx";
import Timer from "../components/Timer.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useRoomStore } from "../context/RoomContext.jsx";

export default function WaitingRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { clearParticipant, getParticipant, saveParticipant } = useRoomStore();
  const { t } = useLanguage();
  const [participant, setParticipant] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const storedParticipant = getParticipant(code);
    if (!storedParticipant) {
      navigate(`/room/${code}`, { replace: true });
      return undefined;
    }

    setParticipant(storedParticipant);
    setDisplayName(storedParticipant.displayName);

    let active = true;
    Promise.all([
      api.joinRoom(code, { participantId: storedParticipant.id }),
      api.getRoom(code),
      api.getParticipants(code)
    ])
      .then(([joinResult, roomResult, participantsResult]) => {
        if (!active) {
          return;
        }

        setParticipant(joinResult.participant);
        setDisplayName(joinResult.participant.displayName || "");
        saveParticipant(code, joinResult.participant);

        if (roomResult.status === "STARTED") {
          navigate(`/room/${code}/quiz`, { replace: true });
          return;
        }

        if (roomResult.status === "FINISHED") {
          navigate(`/room/${code}/result`, { replace: true });
          return;
        }

        setRoom(roomResult);
        setParticipants(participantsResult.participants);
      })
      .catch((nextError) => {
        if (active) {
          if (nextError.message.includes("displayName")) {
            clearParticipant(code);
            navigate(`/room/${code}`, { replace: true });
            return;
          }

          setError(nextError.message);
        }
      });

    const socket = createRoomSocket({ roomCode: code, participantId: storedParticipant.id });
    socket.on("ROOM_STATE", (payload) => {
      setRoom(payload);
      if (payload.status === "STARTED") {
        navigate(`/room/${code}/quiz`, { replace: true });
      }
      if (payload.status === "FINISHED") {
        navigate(`/room/${code}/result`, { replace: true });
      }
    });
    socket.on("ROOM_STARTED", () => {
      navigate(`/room/${code}/quiz`, { replace: true });
    });
    socket.on("ROOM_FINISHED", () => {
      navigate(`/room/${code}/result`, { replace: true });
    });
    socket.on("PARTICIPANTS_UPDATED", (payload) => {
      setParticipants(payload.participants || []);
    });
    socket.on("connect_error", (socketError) => {
      setError(socketError.message);
    });

    return () => {
      active = false;
      socket.close();
    };
  }, [clearParticipant, code, getParticipant, navigate, saveParticipant]);

  async function handleNameSave(event) {
    event.preventDefault();
    if (!participant) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await api.updateParticipantName(code, participant.id, { displayName });
      setParticipant(result.participant);
      setDisplayName(result.participant.displayName);
      saveParticipant(code, result.participant);
      setEditingName(false);
      setNotice(t("nameSaved"));
      window.setTimeout(() => setNotice(""), 1800);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  return (
    <main className="page-shell min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <Link
              to={`/room/${code}`}
              className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              title="Back"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md bg-zinc-950 text-white">
              <Clock size={24} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-950">{room?.quizTitle || "Quizzer"}</h1>
            <p className="mt-3 text-base text-zinc-600">{t("waitingTitle")}</p>
            <div className="mt-4">
              {editingName ? (
                <form className="mx-auto flex max-w-sm gap-2" onSubmit={handleNameSave}>
                  <input
                    className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    value={displayName}
                    maxLength={120}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                  <Button size="sm" type="submit" title={t("save")}>
                    <Save size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingName(false);
                      setDisplayName(participant?.displayName || "");
                    }}
                    title={t("cancel")}
                  >
                    <X size={16} aria-hidden="true" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-semibold text-zinc-800">{participant?.displayName}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingName(true)}
                    title={t("editName")}
                  >
                    <Edit3 size={16} aria-hidden="true" />
                    {t("editName")}
                  </Button>
                </div>
              )}
            </div>
            {room?.startsAt ? (
              <div className="mt-6">
                <Timer targetTime={room.startsAt} serverTime={room.serverTime} label="Start" />
              </div>
            ) : null}
            {notice ? (
              <p className="mt-5 text-sm font-medium text-emerald-700">{notice}</p>
            ) : null}
            {error ? <p className="mt-5 text-sm font-medium text-red-600">{error}</p> : null}
          </div>
        </Card>

        <ParticipantList participants={participants} />
      </div>
    </main>
  );
}
