import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Timer({ targetTime, serverTime, label = "Time", onEnd }) {
  const offsetMs = useMemo(() => {
    if (!serverTime) {
      return 0;
    }
    return new Date(serverTime).getTime() - Date.now();
  }, [serverTime]);

  const [remainingMs, setRemainingMs] = useState(() =>
    targetTime ? new Date(targetTime).getTime() - (Date.now() + offsetMs) : 0
  );

  useEffect(() => {
    if (!targetTime) {
      setRemainingMs(0);
      return undefined;
    }

    const tick = () => {
      const nextRemaining = new Date(targetTime).getTime() - (Date.now() + offsetMs);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        onEnd?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [offsetMs, onEnd, targetTime]);

  if (!targetTime) {
    return null;
  }

  return (
    <div className="inline-flex h-9 min-w-24 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800">
      <Clock size={16} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {formatDuration(remainingMs)}
    </div>
  );
}
