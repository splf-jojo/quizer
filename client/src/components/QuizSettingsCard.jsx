import { CalendarDays, SlidersHorizontal } from "lucide-react";
import Button from "./Button.jsx";
import { fromDateTimeInputValue, toDateTimeInputValue } from "../utils/dateTime.js";

export function createSettingsState(room = {}) {
  return {
    showCorrectAnswers:
      room.showCorrectAnswers === undefined ? true : Boolean(room.showCorrectAnswers),
    allowBackNavigation: room.allowBackNavigation !== false,
    durationMinutes: String(Math.max(1, Math.round((room.durationSeconds || 600) / 60))),
    startsAt: toDateTimeInputValue(room.startsAt),
    endsAt: toDateTimeInputValue(room.endsAt)
  };
}

export function createSettingsPayload(settings) {
  return {
    showCorrectAnswers: settings.showCorrectAnswers,
    allowBackNavigation: settings.allowBackNavigation,
    durationSeconds: Math.max(1, Number(settings.durationMinutes)) * 60,
    startsAt: fromDateTimeInputValue(settings.startsAt),
    endsAt: fromDateTimeInputValue(settings.endsAt)
  };
}

function splitDateTime(value) {
  return {
    date: value ? value.slice(0, 10) : "",
    time: value ? value.slice(11, 16) : ""
  };
}

function mergeDateTime(currentValue, nextPart, nextValue) {
  const current = splitDateTime(currentValue);
  const date = nextPart === "date" ? nextValue : current.date || new Date().toISOString().slice(0, 10);
  const time = nextPart === "time" ? nextValue : current.time || "00:00";

  if (!date) {
    return "";
  }

  return `${date}T${time || "00:00"}`;
}

function SettingToggle({ checked, disabled, label, onChange }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-zinc-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function SettingsSection({ children, icon: Icon, title }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-blue-600">
        <Icon size={20} aria-hidden="true" />
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DateTimeField({ disabled, label, onChange, value }) {
  const { date, time } = splitDateTime(value);

  return (
    <label className="block text-sm font-semibold text-zinc-900">
      {label}
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <input
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
            type="date"
            value={date}
            disabled={disabled}
            onChange={(event) => onChange(mergeDateTime(value, "date", event.target.value))}
          />
        </div>
        <div className="relative">
          <input
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
            type="time"
            value={time}
            disabled={disabled}
            onChange={(event) => onChange(mergeDateTime(value, "time", event.target.value))}
          />
        </div>
      </div>
    </label>
  );
}

function DurationField({ disabled, onChange, t, value }) {
  return (
    <label className="block text-sm font-semibold text-zinc-900">
      {t("duration")}
      <div className="mt-2 inline-flex h-11 overflow-hidden rounded-md border border-zinc-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          className="w-20 border-0 px-3 text-sm outline-none disabled:bg-zinc-100"
          type="number"
          min="1"
          max="120"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="flex items-center border-l border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
          {t("minutes")}
        </span>
      </div>
    </label>
  );
}

export default function QuizSettingsCard({
  actionDisabled = false,
  actionLabel,
  locked = false,
  onSubmit,
  settings,
  settingsDirty = true,
  setSettings,
  showNoChangesHint = true,
  t
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <SettingsSection icon={SlidersHorizontal} title={t("passageParameters")}>
        <div className="grid gap-4 md:grid-cols-2">
          <SettingToggle
            checked={settings.showCorrectAnswers}
            disabled={locked}
            label={t("showCorrectAnswers")}
            onChange={(value) =>
              setSettings((current) => ({ ...current, showCorrectAnswers: value }))
            }
          />
          <SettingToggle
            checked={settings.allowBackNavigation}
            disabled={locked}
            label={t("allowBackNavigation")}
            onChange={(value) =>
              setSettings((current) => ({ ...current, allowBackNavigation: value }))
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection icon={CalendarDays} title={t("scheduleSection")}>
        <div className="grid gap-6 md:grid-cols-2">
          <DateTimeField
            disabled={locked}
            label={t("scheduledStart")}
            value={settings.startsAt}
            onChange={(value) => setSettings((current) => ({ ...current, startsAt: value }))}
          />
          <DateTimeField
            disabled={locked}
            label={t("scheduledFinish")}
            value={settings.endsAt}
            onChange={(value) => setSettings((current) => ({ ...current, endsAt: value }))}
          />
        </div>
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <DurationField
            disabled={locked}
            t={t}
            value={settings.durationMinutes}
            onChange={(value) =>
              setSettings((current) => ({
                ...current,
                durationMinutes: value
              }))
            }
          />
        </div>
      </SettingsSection>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end">
        {showNoChangesHint && !locked && !settingsDirty ? (
          <span className="text-xs font-medium text-zinc-500">{t("noSettingsChanges")}</span>
        ) : null}
        {locked ? <span className="text-sm text-zinc-500">{t("lockedSettings")}</span> : null}
        <Button type="submit" disabled={actionDisabled || locked || !settingsDirty}>
          {actionLabel || t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
