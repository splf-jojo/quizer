import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http.js";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Timer from "../components/Timer.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useRoomStore } from "../context/RoomContext.jsx";

export default function RoomJoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { clearParticipant, getParticipantId, saveParticipant } = useRoomStore();
  const { t } = useLanguage();
  const [room, setRoom] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function navigateForStatus(status) {
    if (status === "STARTED") {
      navigate(`/room/${code}/quiz`, { replace: true });
      return;
    }

    if (status === "FINISHED") {
      navigate(`/room/${code}/result`, { replace: true });
      return;
    }

    navigate(`/room/${code}/waiting`, { replace: true });
  }

  useEffect(() => {
    let active = true;
    setError("");

    api
      .getRoom(code)
      .then((result) => {
        if (active) {
          const participantId = getParticipantId(code);
          if (participantId) {
            setLoading(true);
            api
              .joinRoom(code, { participantId })
              .then((joinResult) => {
                if (!active) {
                  return;
                }

                saveParticipant(code, joinResult.participant);
                navigateForStatus(joinResult.room.status);
              })
              .catch(() => {
                clearParticipant(code);
                setRoom(result);
              })
              .finally(() => {
                if (active) {
                  setLoading(false);
                }
              });
            return;
          }

          setRoom(result);
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
  }, [clearParticipant, code, getParticipantId, navigate, saveParticipant]);

  async function handleJoin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const participantId = getParticipantId(code);
      const result = await api.joinRoom(code, { displayName, participantId });
      saveParticipant(code, result.participant);
      navigateForStatus(result.room.status);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md p-6">
        {room ? (
          <>
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {room.startsAt ? (
                  <Timer targetTime={room.startsAt} serverTime={room.serverTime} label="Start" />
                ) : (
                  <span className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs font-bold text-zinc-600">
                    <Clock size={14} aria-hidden="true" />
                    {t("manualStart")}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-zinc-950">{room.quizTitle}</h1>
              {room.status === "FINISHED" ? (
                <p className="mt-2 text-sm font-medium text-red-600">{t("roomFinished")}</p>
              ) : null}
            </div>

            <form className="space-y-4" onSubmit={handleJoin}>
              <label className="block text-sm font-semibold text-zinc-800">
                {t("displayName")}
                <input
                  className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  value={displayName}
                  maxLength={120}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={room.status === "FINISHED"}
                />
              </label>
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <Button
                className="w-full"
                type="submit"
                disabled={loading || room.status === "FINISHED"}
              >
                {t("joinRoom")}
                {room.status === "STARTED" ? (
                  <ArrowRight size={17} aria-hidden="true" />
                ) : (
                  <CheckCircle size={17} aria-hidden="true" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-600">
            {error || t("loadingRoom")}
          </div>
        )}
      </Card>
    </main>
  );
}
