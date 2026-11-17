/**
 * Bon cadeau « Coffret box 3 mois » vendu au stand.
 * Appelée par /stand.html après l'enregistrement de la fiche : envoie à
 * l'ACHETEUR un email avec son bon cadeau (copie cachée à l'admin).
 *
 * Auth : header Authorization: Bearer <STAND_ADMIN_TOKEN> (même mot de passe
 * que le tableau de bord stand) → impossible de s'en servir pour envoyer des
 * emails depuis l'extérieur.
 *
 * Variables Netlify : STAND_ADMIN_TOKEN, LPS_SMTP_USER, LPS_SMTP_APP_PASSWORD
 * (+ LPS_NOTIFY_TO_EMAIL, LPS_NOTIFY_FROM_EMAIL optionnels).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    body: JSON.stringify(payload),
  };
}

const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const html = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function voucherHtml({ buyerName, recipientName, firstBoxLabel, message }) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f9f5f2;font-family:Georgia,'Times New Roman',serif;color:#2a1e18;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;">Bonjour ${html(buyerName)},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;">Merci pour votre achat au stand ! Voici votre bon cadeau, à imprimer ou à transférer.</p>
    <div style="border:2px solid #b8706b;border-radius:16px;background:#fffdfb;padding:28px 24px;text-align:center;margin:20px 0;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b8706b;">Bon cadeau</p>
      <p style="margin:10px 0 4px;font-size:28px;font-weight:bold;">3 mois de box broderie</p>
      <p style="margin:0 0 18px;font-style:italic;color:#6b5448;">Les Points Rebelles</p>
      <p style="margin:6px 0;font-size:17px;">Pour <strong>${html(recipientName)}</strong></p>
      <p style="margin:6px 0;font-size:17px;">De la part de <strong>${html(buyerName)}</strong></p>
      ${message ? `<p style="margin:14px 0 0;font-style:italic;color:#6b5448;">« ${html(message)} »</p>` : ""}
      <p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#6b5448;">Première box : <strong style="color:#2a1e18;">${html(firstBoxLabel)}</strong></p>
      <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#6b5448;">3 box, une par mois · motif, fils, tambour, aiguille et notice · livraison comprise</p>
    </div>
    <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#6b5448;">
      Une question, un changement d'adresse ou de date ? Répondez simplement à cet email.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#6b5448;">Les Points Rebelles · <a href="https://lespointsrebelles.netlify.app/" style="color:#b8706b;">lespointsrebelles.netlify.app</a></p>
  </div>
</body></html>`;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const expected = process.env.STAND_ADMIN_TOKEN;
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!expected || token !== expected) return json(401, { error: "Unauthorized" });

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const buyerName = clean(payload.buyerName, 120);
  const buyerEmail = clean(payload.buyerEmail, 254).toLowerCase();
  const recipientName = clean(payload.recipientName, 120);
  const firstBoxLabel = clean(payload.firstBoxLabel, 120);
  const message = clean(payload.message, 300);
  if (!buyerName || !recipientName || !firstBoxLabel) return json(400, { error: "missing_fields" });
  if (!EMAIL_RE.test(buyerEmail)) return json(400, { error: "invalid_email" });

  const smtpUser = String(process.env.LPS_SMTP_USER || "").trim();
  const smtpPass = String(process.env.LPS_SMTP_APP_PASSWORD || "").trim();
  const adminEmail = String(process.env.LPS_NOTIFY_TO_EMAIL || smtpUser).trim();
  const fromEmail = String(process.env.LPS_NOTIFY_FROM_EMAIL || smtpUser).trim();
  if (!smtpUser || !smtpPass) return json(500, { error: "missing_smtp_config" });

  const text = [
    `Bonjour ${buyerName},`,
    "",
    "Merci pour votre achat au stand ! Voici votre bon cadeau.",
    "",
    "BON CADEAU — 3 mois de box broderie Les Points Rebelles",
    `Pour : ${recipientName}`,
    `De la part de : ${buyerName}`,
    message ? `Message : ${message}` : "",
    `Première box : ${firstBoxLabel}`,
    "3 box, une par mois · motif, fils, tambour, aiguille et notice · livraison comprise",
    "",
    "Une question, un changement d'adresse ou de date ? Répondez simplement à cet email.",
    "",
    "Les Points Rebelles — https://lespointsrebelles.netlify.app/",
  ]
    .filter((line) => line !== "")
    .join("\n");

  try {
    const nodemailerModule = await import("nodemailer");
    const nodemailer = nodemailerModule?.default || nodemailerModule;
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPass } });
    await transporter.sendMail({
      from: fromEmail,
      to: buyerEmail,
      bcc: adminEmail,
      replyTo: adminEmail,
      subject: `🎁 Votre bon cadeau : 3 mois de box broderie pour ${recipientName}`,
      text,
      html: voucherHtml({ buyerName, recipientName, firstBoxLabel, message }),
    });
    return json(200, { ok: true });
  } catch (err) {
    return json(502, { error: "send_failed", message: err?.message || "unknown_error" });
  }
};
