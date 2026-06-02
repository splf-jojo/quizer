import QuizOption from "./QuizOption.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function QuizQuestion({ question, selectedOptionId, onSelect, current, total }) {
  const { t } = useLanguage();

  return (
    <article className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-normal text-violet-700">
          {t("questionProgress", { current, total })}
        </p>
        <h2 className="mt-1 text-lg font-bold leading-snug text-zinc-950">{question.text}</h2>
      </div>
      <div className="space-y-3">
        {question.options.map((option) => (
          <QuizOption
            key={option.id}
            option={option}
            selected={selectedOptionId === option.id}
            onSelect={() => onSelect(question.id, option.id)}
          />
        ))}
      </div>
    </article>
  );
}
