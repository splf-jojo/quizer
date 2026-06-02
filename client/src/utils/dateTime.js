export function toDateTimeInputValue(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeInputValue(value) {
  return value ? new Date(value).toISOString() : null;
}

export function formatDateTime(isoValue) {
  if (!isoValue) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoValue));
}
