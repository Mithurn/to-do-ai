export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/app/db/drizzle";
import bcrypt from "bcryptjs";
import { lucia } from "@/app/aut";
import { userTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export type Result = { success: true } | { error: string };

export async function POST(request: Request): Promise<NextResponse<Result>> {
  const body = await request.json();
  const { email, password } = body;

  if (
    typeof email !== "string" ||
    email.length < 3 ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)
    .then((users) => users[0]);

  if (!existingUser) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 400 }
    );
  }

  const validPassword = await bcrypt.compare(password, existingUser.hash_password);

  if (!validPassword) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 400 }
    );
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    }
  );
}
