import { useLanguage } from "../context/LanguageContext.jsx";

export function statusClasses(status) {
  const classes = {
    WAITING: "border-amber-300 bg-amber-50 text-amber-800",
    STARTED: "border-emerald-300 bg-emerald-50 text-emerald-800",
    FINISHED: "border-zinc-300 bg-zinc-100 text-zinc-700",
    CANCELLED: "border-red-300 bg-red-50 text-red-700"
  };

  return classes[status] || "border-zinc-300 bg-white text-zinc-700";
}

export function StatusBadge({ status }) {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold ${statusClasses(
        status
      )}`}
    >
      {t(`status_${status}`)}
    </span>
  );
}
