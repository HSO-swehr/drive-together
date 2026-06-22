import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { localDateTimeToISO, formatLocalDateTime } from '../src/utils/datetime';

// Pin a non-UTC timezone *without* DST (UTC+05:30) so the assertions are exact
// and actually exercise the offset. Under UTC (the CI default) a wall-clock →
// UTC conversion is a no-op and would hide the bug this fix addresses.
describe('datetime utils (TZ = Asia/Kolkata, UTC+05:30)', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'Asia/Kolkata');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('localDateTimeToISO', () => {
    it('interprets the datetime-local value as local wall-clock, not UTC', () => {
      // 14:30 local in UTC+05:30 is 09:00 UTC.
      expect(localDateTimeToISO('2026-06-23T14:30')).toBe('2026-06-23T09:00:00.000Z');
    });

    it('does NOT mislabel the local time as UTC (regression guard)', () => {
      // The old implementation appended "Z", yielding 14:30Z — the bug.
      expect(localDateTimeToISO('2026-06-23T14:30')).not.toBe('2026-06-23T14:30:00.000Z');
    });
  });

  describe('formatLocalDateTime', () => {
    it('formats an instant back to German local wall-clock', () => {
      // 09:00 UTC shown in UTC+05:30 is 14:30.
      expect(formatLocalDateTime('2026-06-23T09:00:00.000Z')).toBe('23.06.2026 14:30');
    });

    it('returns the input unchanged for an unparseable string', () => {
      expect(formatLocalDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  it('round-trips a wall-clock time entered in the form back to the same display', () => {
    // This is the property the timezone bug broke: what the user picks is what
    // they see in the list, independent of the timezone offset.
    const entered = '2026-06-23T14:30';
    expect(formatLocalDateTime(localDateTimeToISO(entered))).toBe('23.06.2026 14:30');
  });
});
