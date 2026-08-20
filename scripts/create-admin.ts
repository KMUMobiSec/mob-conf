import "dotenv/config";
import { betterAuth } from "better-auth/minimal";
import { eq } from "drizzle-orm";
import { closeDb, db } from "@/db";
import { user } from "@/db/schema";
import { createAuthOptions } from "@/lib/auth/config";
import { collectAdminRegistrationInput } from "@/scripts/admin-registration-input";

async function main() {
  const { email, password, name } = await collectAdminRegistrationInput();

  const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existingUser) {
    if (existingUser.role !== "admin" || existingUser.banned) {
      await db
        .update(user)
        .set({
          role: "admin",
          banned: false,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existingUser.id));
    }

    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const bootstrapAuth = betterAuth(createAuthOptions({ disableSignUp: false }));

  await bootstrapAuth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "admin",
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
