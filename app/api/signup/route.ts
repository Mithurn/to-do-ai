export const dynamic = "force-dynamic";
// trigger redeploy
import { NextResponse } from "next/server";
import { db } from "@/app/db/drizzle";
import bcrypt from "bcryptjs";
import { lucia } from "@/app/aut";
import { generateId } from "lucia";
import { userTable } from "@/app/db/schema";
import { Result } from "../signin/route";

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

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = generateId(15);

  try {
    await db.insert(userTable).values({
      id: userId,
      email: email,
      hash_password: passwordHash,
    });

    const session = await lucia.createSession(userId, {});
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
  } catch (e) {
    console.log(e);

    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }
}
