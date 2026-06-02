import { Check } from "lucide-react";

export default function QuizOption({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm transition ${
        selected
          ? "border-violet-700 bg-violet-50 text-zinc-950 shadow-sm"
          : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
      }`}
    >
      <span className="break-words">{option.text}</span>
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          selected ? "border-violet-700 bg-violet-700 text-white" : "border-zinc-300 bg-white"
        }`}
      >
        {selected ? <Check size={13} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}
