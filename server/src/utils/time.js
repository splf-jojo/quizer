export function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

export function serverTime() {
  return new Date().toISOString();
}

export function parseOptionalDate(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
}
