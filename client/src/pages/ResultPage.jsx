import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/http.js";
import Card from "../components/Card.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useRoomStore } from "../context/RoomContext.jsx";

export default function ResultPage() {
  const { code } = useParams();
  const { getParticipant, getResult } = useRoomStore();
  const { t } = useLanguage();
  const [result, setResult] = useState(() => getResult(code));
  const [error, setError] = useState("");

  useEffect(() => {
    const participant = getParticipant(code);
    if (!participant) {
      setError("Participant session was not found");
      return;
    }

    let active = true;
    api
      .getResult(code, participant.id)
      .then((nextResult) => {
        if (active) {
          setResult(nextResult);
          setError("");
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
  }, [code, getParticipant]);

  return (
    <main className="page-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Card className="p-6">
          {result ? (
            result.showCorrectAnswers ? (
              <>
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-normal text-violet-700">
                    {t("result")}
                  </p>
                  <h1 className="mt-2 text-4xl font-bold text-zinc-950">
                    {result.score} / {result.total}
                  </h1>
                  <p className="mt-2 text-lg font-semibold text-zinc-700">
                    {t("percentCorrect", { percentage: result.percentage })}
                  </p>
                </div>
                <div className="space-y-3">
                  {result.details.map((detail) => (
                    <div
                      key={detail.questionText}
                      className="rounded-lg border border-zinc-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        {detail.isCorrect ? (
                          <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                        ) : (
                          <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
                        )}
                        <h2 className="font-bold leading-snug text-zinc-950">
                          {detail.questionText}
                        </h2>
                      </div>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <div className="rounded-md bg-zinc-50 px-3 py-2">
                          <span className="block text-xs font-bold uppercase tracking-normal text-zinc-500">
                            {t("selected")}
                          </span>
                          <span className="font-medium text-zinc-800">
                            {detail.selectedOptionText}
                          </span>
                        </div>
                        <div className="rounded-md bg-emerald-50 px-3 py-2">
                          <span className="block text-xs font-bold uppercase tracking-normal text-emerald-700">
                            {t("correct")}
                          </span>
                          <span className="font-medium text-emerald-900">
                            {detail.correctOptionText}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md bg-emerald-600 text-white">
                  <CheckCircle size={26} aria-hidden="true" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-950">
                  {t("answersSubmitted")}
                </h1>
                <p className="mt-3 text-base text-zinc-600">{t("thankYou")}</p>
              </div>
            )
          ) : (
            <div className="py-12 text-center text-sm text-zinc-600">
              {error || t("loadingResult")}
            </div>
          )}
          {error && result ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
        </Card>
      </div>
    </main>
  );
}
