import { startOfDay } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export const EASTERN_TZ = "America/New_York";

export function startOfDayZoned(dateGMT: Date, timezone: string): Date {
  return zonedTimeToUtc(
    startOfDay(utcToZonedTime(dateGMT, timezone)),
    timezone
  );
}
