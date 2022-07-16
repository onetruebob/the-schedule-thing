import { json } from "@remix-run/node";

const CronToken = process.env.CRON_TOKEN;
if (!CronToken) {
  throw new Error("CRON_TOKEN must be set");
}

export async function requireValidCronToken(request: Request) {
  const requestData = await request.json();
  if (requestData?.cron_token !== CronToken) {
    throw json({}, 401);
  }
}
