import { NextRequest, NextResponse } from "next/server";
import { createAuthChallenge } from "@/lib/auth-challenge-store";
import { sendAuthCodeEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; displayName?: string; timezone?: string };
  const email = body.email?.trim().toLowerCase() || "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Valid email is required", fields: ["email"] }, { status: 400 });
  }

  const result = createAuthChallenge({ email, displayName: body.displayName, timezone: body.timezone });

  try {
    const mail = await sendAuthCodeEmail({ to: email, code: result.code, expiresAt: result.expiresAt });

    return NextResponse.json({
      ok: true,
      challengeId: result.challengeId,
      expiresAt: result.expiresAt,
      delivered: mail.delivered,
      transport: mail.transport,
      devCode: !mail.delivered && process.env.NODE_ENV !== "production" ? result.code : undefined
    });
  } catch (e) {
    return NextResponse.json(
      {
        code: "MAIL_DELIVERY_FAILED",
        message: e instanceof Error ? e.message : "Failed to send authentication email"
      },
      { status: 500 }
    );
  }
}
