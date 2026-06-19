/**
 * Timezone-aware streak utilities.
 * GitHub timestamps are UTC; streaks are evaluated on the user's local calendar day.
 */

export const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const isValidTimezone = (timeZone) => {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const resolveTimezone = (timeZone) => {
  if (isValidTimezone(timeZone)) return timeZone;
  return detectTimezone();
};

/** @returns {string|null} YYYY-MM-DD in the given IANA timezone */
export const toLocalDateString = (dateInput, timeZone) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimezone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

/** Shift a calendar date string by a number of days (timezone-agnostic). */
export const addDaysToDateString = (dateStr, days) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().split("T")[0];
};

/**
 * Calculate consecutive-day GitHub contribution streak from event timestamps.
 * @param {string[]} eventTimestamps ISO-8601 strings from GitHub events
 * @param {string} [timeZone] IANA timezone (defaults to browser)
 * @param {Date} [referenceDate] "today" anchor (defaults to now)
 */
export const calculateGithubStreak = (
  eventTimestamps,
  timeZone,
  referenceDate = new Date()
) => {
  const tz = resolveTimezone(timeZone);
  const eventDates = new Set();

  for (const ts of eventTimestamps) {
    const localDate = toLocalDateString(ts, tz);
    if (localDate) eventDates.add(localDate);
  }

  const todayStr = toLocalDateString(referenceDate, tz);
  const yesterdayStr = addDaysToDateString(todayStr, -1);

  const startDateStr = eventDates.has(todayStr)
    ? todayStr
    : eventDates.has(yesterdayStr)
      ? yesterdayStr
      : null;

  if (!startDateStr) return 0;

  let streak = 0;
  let dateToCheck = startDateStr;
  while (eventDates.has(dateToCheck)) {
    streak += 1;
    dateToCheck = addDaysToDateString(dateToCheck, -1);
  }

  return streak;
};

/**
 * Daily login streak update based on local calendar days.
 */
export const evaluateLoginStreak = (
  lastLoginIso,
  currentLoginIso,
  currentStreak,
  timeZone
) => {
  const tz = resolveTimezone(timeZone);
  const currentDateStr = toLocalDateString(currentLoginIso, tz);
  const lastDateStr = lastLoginIso ? toLocalDateString(lastLoginIso, tz) : null;

  if (!lastDateStr) {
    return { streak: 1, updated: true };
  }

  if (lastDateStr === currentDateStr) {
    return { streak: currentStreak, updated: false };
  }

  const yesterdayStr = addDaysToDateString(currentDateStr, -1);
  if (lastDateStr === yesterdayStr) {
    return { streak: currentStreak + 1, updated: true };
  }

  return { streak: 1, updated: true };
};

/**
 * CodingVerse daily solve streak update based on local calendar days.
 */
export const evaluateCodingVerseStreak = (
  lastSolveDateStr,
  currentStreak,
  timeZone,
  referenceDate = new Date()
) => {
  const tz = resolveTimezone(timeZone);
  const todayStr = toLocalDateString(referenceDate, tz);

  if (!lastSolveDateStr) {
    return {
      streak: 1,
      lastSolveDate: todayStr,
      earnedStreakPoints: 5,
      progressed: true,
    };
  }

  if (lastSolveDateStr === todayStr) {
    return {
      streak: currentStreak,
      lastSolveDate: lastSolveDateStr,
      earnedStreakPoints: 0,
      progressed: false,
    };
  }

  const yesterdayStr = addDaysToDateString(todayStr, -1);
  let newStreak = 1;
  if (lastSolveDateStr === yesterdayStr) {
    newStreak = currentStreak + 1;
  }

  return {
    streak: newStreak,
    lastSolveDate: todayStr,
    earnedStreakPoints: 5,
    progressed: true,
  };
};
