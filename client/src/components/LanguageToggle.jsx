import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageToggle({ className = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`inline-flex h-9 overflow-hidden rounded-md border border-zinc-300 bg-white text-xs font-bold ${className}`}
      aria-label={t("language")}
    >
      <button
        type="button"
        className={`min-w-11 px-3 ${language === "ru" ? "bg-zinc-950 text-white" : "text-zinc-700"}`}
        onClick={() => setLanguage("ru")}
      >
        {t("russian")}
      </button>
      <button
        type="button"
        className={`min-w-11 px-3 ${language === "en" ? "bg-zinc-950 text-white" : "text-zinc-700"}`}
        onClick={() => setLanguage("en")}
      >
        {t("english")}
      </button>
    </div>
  );
}
