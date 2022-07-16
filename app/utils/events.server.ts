import { Events } from "@prisma/client";
import { differenceInDays, format, isSameDay } from "date-fns";
import { db } from "./db.server";
import { updateTidbyt } from "./tidbyt.server";
import { EASTERN_TZ, startOfDayZoned } from "./time.server";

export interface FormattedEvent extends Events {
  formattedDate: string;
  englishDaysUntil: string;
}

export async function getUpcomingEvents(): Promise<FormattedEvent[]> {
  const today = startOfDayZoned(new Date(), EASTERN_TZ);
  const formatEvent = formatEventForDate(today);
  const dbEvents = await db.events.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
  });
  return dbEvents.map(formatEvent);
}

export async function getNextEvent(): Promise<FormattedEvent | undefined> {
  const today = startOfDayZoned(new Date(), EASTERN_TZ);
  const formatEvent = formatEventForDate(today);
  const nextEvent = await db.events.findFirst({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
  });
  return nextEvent ? formatEvent(nextEvent) : undefined;
}

export async function addNewEvent({
  eventName,
  eventDate,
}: {
  eventName: string;
  eventDate: Date;
}): Promise<Events> {
  const zonedEventDate = startOfDayZoned(eventDate, EASTERN_TZ);
  const result = await db.events.create({
    data: { eventName, date: zonedEventDate },
  });
  publishUpcommingEvent();
  return result;
}

export async function removeEvent({
  eventId,
}: {
  eventId: Events["id"];
}): Promise<void> {
  await db.events.delete({ where: { id: eventId } });
  publishUpcommingEvent();
}

export async function publishUpcommingEvent(): Promise<void> {
  const nextEvent: FormattedEvent = (await getNextEvent()) ?? {
    id: "",
    eventName: "* No next event *",
    date: new Date(),
    formattedDate: "",
    englishDaysUntil: "---",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await updateTidbyt(nextEvent);
}

function formatEventForDate(rootDate: Date): (event: Events) => FormattedEvent {
  return function formatEvent(event: Events): FormattedEvent {
    const formattedDate = format(event.date, "E, LLL do");
    const englishDaysUntil = formatDaysUntil(rootDate, event.date);
    return {
      ...event,
      formattedDate,
      englishDaysUntil,
    };
  };
}

function formatDaysUntil(currentDate: Date, targetDate: Date): string {
  const days = differenceInDays(targetDate, currentDate);
  if (days < 0) {
    return "has passed";
  }
  if (isSameDay(currentDate, targetDate)) {
    return "Today";
  }
  return `in ${days} days`;
}
