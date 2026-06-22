import type { ISO8601DateTime } from 'shared';

/**
 * Convert the value of an `<input type="datetime-local">` — local wall-clock in
 * the shape "YYYY-MM-DDTHH:MM", with no timezone — into a proper ISO 8601 UTC
 * instant.
 *
 * The datetime-local value is the time the user reads off their wall clock. We
 * construct a Date from its parts (which the runtime interprets in the local
 * timezone) and let `toISOString()` produce the matching UTC instant. Appending
 * a literal "Z" instead would mislabel the local time as UTC and shift the value
 * by the local offset.
 */
export function localDateTimeToISO(value: string): ISO8601DateTime {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toISOString() as ISO8601DateTime;
}

/**
 * Format an ISO 8601 instant as German local wall-clock "DD.MM.YYYY HH:MM".
 *
 * Uses local getters, so a value produced by {@link localDateTimeToISO} round-trips
 * back to the exact wall-clock time the user originally entered.
 */
export function formatLocalDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
