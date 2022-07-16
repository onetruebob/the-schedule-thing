import { json, LoaderFunction } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async () => {
  const userCount = await db.user.count();
  if (userCount !== 0) {
    return json({ message: "No Content" }, 200);
  }

  const seedPassword = process.env.SEED_PASSWORD;
  if (typeof seedPassword !== "string")
    throw new Error("Must provide SEED_PASSWORD on the environment");

  await db.user.create({
    data: {
      username: "onetruebob",
      passwordHash: await bcrypt.hash(seedPassword, 10),
    },
  });

  return json("Seed Complete", 200);
};
