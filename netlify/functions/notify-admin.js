function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  };
}

function safe(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatDetails(details) {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details)
    .map(([key, value]) => `- ${key}: ${safe(value)}`)
    .join("\n");
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const smtpUser = String(process.env.LPS_SMTP_USER || "").trim();
  const smtpPass = String(process.env.LPS_SMTP_APP_PASSWORD || "").trim();
  const toEmail = String(process.env.LPS_NOTIFY_TO_EMAIL || smtpUser).trim();
  const fromEmail = String(process.env.LPS_NOTIFY_FROM_EMAIL || smtpUser).trim();

  if (!smtpUser || !smtpPass || !toEmail || !fromEmail) {
    return json(500, {
      error: "Missing SMTP notification config",
      required: ["LPS_SMTP_USER", "LPS_SMTP_APP_PASSWORD"],
      optional: ["LPS_NOTIFY_TO_EMAIL", "LPS_NOTIFY_FROM_EMAIL"],
    });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    payload = {};
  }

  const eventType = String(payload.eventType || "").trim();
  const title = String(payload.title || "").trim();
  const details = payload.details && typeof payload.details === "object" ? payload.details : {};

  if (!eventType || !title) {
    return json(400, { error: "Missing eventType or title" });
  }

  const detailsText = formatDetails(details);
  const subject = `[LPS] ${title}`;
  const text = [
    "Nouvelle notification automatique depuis le site LPS.",
    "",
    `Type: ${eventType}`,
    `Titre: ${title}`,
    `Date: ${new Date().toISOString()}`,
    "",
    "Détails:",
    detailsText || "- (aucun détail)",
  ].join("\n");

  try {
    const nodemailerModule = await import("nodemailer");
    const nodemailer = nodemailerModule?.default || nodemailerModule;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject,
      text,
    });
    return json(200, { ok: true, id: info?.messageId || null });
  } catch (err) {
    return json(500, {
      error: "Notification send failed",
      message: err?.message || "unknown_error",
    });
  }
};
