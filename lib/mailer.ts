import nodemailer from "nodemailer";

type SendResult = {
  delivered: boolean;
  transport: "smtp" | "dev-fallback";
};

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from
  };
}

export async function sendAuthCodeEmail(params: {
  to: string;
  code: string;
  expiresAt: string;
}): Promise<SendResult> {
  const cfg = smtpConfig();

  if (!cfg) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    // Dev fallback for local verification.
    console.log(`[auth-code] to=${params.to} code=${params.code} expiresAt=${params.expiresAt}`);
    return { delivered: false, transport: "dev-fallback" };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth
  });
  await transporter.verify();

  await transporter.sendMail({
    from: cfg.from,
    to: params.to,
    subject: "Observation Log: Sign-in code",
    text: `Your sign-in code is ${params.code}. It expires at ${params.expiresAt}.`,
    html: `<p>Your sign-in code is <strong>${params.code}</strong>.</p><p>Expires at: ${params.expiresAt}</p>`
  });

  return { delivered: true, transport: "smtp" };
}
