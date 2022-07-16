import { exec } from "child_process";
import fs from "fs/promises";
import { FormattedEvent } from "./events.server";
const Tidbyt = require("tidbyt");
const tidbytDeviceId = process.env.TIDBYT_DEVICE_ID;
const tidbytApiKey = process.env.TIDBYT_API_KEY;
const tidbyt = new Tidbyt(tidbytApiKey);

export async function updateTidbyt(event: FormattedEvent): Promise<void> {
  const { eventName, englishDaysUntil } = event;
  const data = {
    eventName,
    englishDaysUntil,
  };
  const renderCommand = getRenderCommand(JSON.stringify(data));
  await execPromise(renderCommand);
  await pushTidbytImage("app/tidbyt/the-schedule-thing.webp");
}

async function pushTidbytImage(imagePath: string) {
  const tidbytDevice = await tidbyt.devices.get(tidbytDeviceId);
  const imageBuffer = await fs.readFile(imagePath);
  await tidbytDevice.push(imageBuffer, {
    installationID: "TheScheduleThing",
    background: false,
  });
}

function getRenderCommand(data: string): string {
  return `pixlet render app/tidbyt/the-schedule-thing.star data='${escapeSingleQuote(
    data
  )}'`;
}

function execPromise(command: string): Promise<string> {
  return new Promise((res, rej) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        rej(error);
        return;
      }

      if (stderr) {
        rej(stderr);
        return;
      }

      res(stdout);
    });
  });
}

function escapeSingleQuote(toEscape: string): string {
  return toEscape.replace(/'/g, "'\"'\"'");
}
