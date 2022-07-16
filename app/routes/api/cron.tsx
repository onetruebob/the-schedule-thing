import { ActionFunction, json } from "@remix-run/node";
import { requireValidCronToken } from "~/utils/cron.server";
import { publishUpcommingEvent } from "~/utils/events.server";

export const action: ActionFunction = async ({ request }) => {
  await requireValidCronToken(request);
  publishUpcommingEvent();
  return json({}, 200);
};
