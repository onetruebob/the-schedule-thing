import { Events } from "@prisma/client";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { toDate } from "date-fns-tz";
import {
  addNewEvent,
  FormattedEvent,
  getNextEvent,
  getUpcomingEvents,
  removeEvent,
} from "~/utils/events.server";
import { requireUserId } from "~/utils/session.server";
import { EASTERN_TZ } from "~/utils/time.server";

interface LoaderData {
  upcomingEvents: FormattedEvent[];
  nextEvent: FormattedEvent | undefined;
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);
  const [upcomingEvents, nextEvent] = await Promise.all([
    getUpcomingEvents(),
    getNextEvent(),
  ]);
  return json<LoaderData>({
    upcomingEvents,
    nextEvent,
  });
};

enum ActionMethod {
  ADD = "ADD",
  DELETE = "DELETE",
}

export const action: ActionFunction = async ({ request }) => {
  await requireUserId(request);
  const formData = await request.formData();
  const method = formData.get("_method") as ActionMethod | undefined;
  if (!method) {
    return json({ error: "Bad Request" }, 400);
  }

  if (method === ActionMethod.ADD) {
    const eventName = formData.get("eventName") as string;
    const eventDateStr = formData.get("date") as string;
    const eventDate = toDate(eventDateStr, { timeZone: EASTERN_TZ });
    const newEvent = await addNewEvent({ eventName, eventDate });
    return json(newEvent);
  }

  if (method === ActionMethod.DELETE) {
    const eventId = formData.get("eventId") as Events["id"];
    await removeEvent({ eventId });
    return json({}, 200);
  }
};

export default function Index() {
  const { upcomingEvents, nextEvent } = useLoaderData<LoaderData>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>🎒 The Schedule Thing</h1>
      <h2>Next event:</h2>
      {nextEvent ? (
        <article>
          <h3>{nextEvent.eventName}</h3>
          <p>{nextEvent.englishDaysUntil}</p>
        </article>
      ) : (
        <p>No next event</p>
      )}
      <h2>Add an event</h2>
      <Form method="post">
        <label>
          Name: <input type="text" name="eventName" required />
        </label>{" "}
        <label>
          Date: <input type="date" name="date" required />
        </label>{" "}
        <input type="hidden" name="_method" value={ActionMethod.ADD} />
        <button type="submit">Add</button>
      </Form>
      <h2>Upcoming events</h2>
      <ul>
        {upcomingEvents.length === 0 && <p>No upcoming events</p>}
        {upcomingEvents.map(
          ({ id, eventName, formattedDate, englishDaysUntil }) => (
            <li key={id}>
              <Form method="post">
                <input type="hidden" name="eventId" value={id} />
                <input
                  type="hidden"
                  name="_method"
                  value={ActionMethod.DELETE}
                />
                {`${eventName} - ${formattedDate} - ${englishDaysUntil}`}
                <button type="submit">Delete</button>
              </Form>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
