import { Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ParticipantList({ participants }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Users size={17} aria-hidden="true" />
          {t("participants")}
        </div>
        <span className="text-sm text-zinc-500">{participants.length}</span>
      </div>
      <div className="max-h-72 overflow-auto p-2">
        {participants.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-zinc-500">{t("noParticipants")}</div>
        ) : (
          participants.map((participant) => (
            <div
              key={participant.id}
              className="flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-sm"
            >
              <span className="truncate font-medium text-zinc-800">{participant.displayName}</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  participant.connected ? "bg-emerald-500" : "bg-zinc-300"
                }`}
                title={participant.connected ? "Connected" : "Offline"}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
