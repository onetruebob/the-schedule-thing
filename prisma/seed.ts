import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function seed() {
  const seedPassword = process.env.SEED_PASSWORD;
  if (typeof seedPassword !== "string")
    throw new Error("Must provide SEED_PASSWORD on the environment");

  await db.user.create({
    data: {
      username: "onetruebob",
      passwordHash: await bcrypt.hash(seedPassword, 10),
    },
  });
}

seed();
