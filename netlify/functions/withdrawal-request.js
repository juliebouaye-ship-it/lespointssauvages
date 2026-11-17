/**
 * Fonction de rétractation (« Renoncer au contrat ici »).
 *
 * Reçoit la déclaration du client (email + référence de commande, précisions
 * facultatives), puis :
 *   1. envoie au client un ACCUSÉ DE RÉCEPTION par email (support durable) ;
 *   2. alerte l'admin par email ;
 *   3. enregistre la demande dans Supabase (table withdrawal_requests).
 * La demande n'est déclarée réussie au client que si l'accusé de réception
 * est bien parti.
 *
 * Variables Netlify (déjà utilisées par notify-admin / stand-orders-list) :
 * - LPS_SMTP_USER, LPS_SMTP_APP_PASSWORD (+ LPS_NOTIFY_TO_EMAIL, LPS_NOTIFY_FROM_EMAIL optionnels)
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Table : supabase/migrations/withdrawal-requests.sql
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    body: JSON.stringify(payload),
  };
}

const clean = (value, max) => String(value ?? "").replace(/\s+$/g, "").trim().slice(0, max);

function formatParisDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

async function saveToSupabase(row) {
  const baseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return { ok: false, error: "missing_supabase_config" };
  try {
    const res = await fetch(`${baseUrl}/rest/v1/withdrawal_requests`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) return { ok: false, error: `supabase_http_${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "supabase_fetch_failed" };
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid_json" });
  }

  /* Champ piège anti-robots : invisible pour les humains */
  if (clean(payload.website, 200)) return json(200, { ok: true });

  const email = clean(payload.email, 254).toLowerCase();
  const orderRef = clean(payload.orderRef, 120);
  const details = clean(payload.details, 1500);

  if (!EMAIL_RE.test(email)) return json(400, { error: "invalid_email" });
  if (!orderRef) return json(400, { error: "missing_order_ref" });

  const smtpUser = String(process.env.LPS_SMTP_USER || "").trim();
  const smtpPass = String(process.env.LPS_SMTP_APP_PASSWORD || "").trim();
  const adminEmail = String(process.env.LPS_NOTIFY_TO_EMAIL || smtpUser).trim();
  const fromEmail = String(process.env.LPS_NOTIFY_FROM_EMAIL || smtpUser).trim();
  if (!smtpUser || !smtpPass) return json(500, { error: "missing_smtp_config" });

  const receivedAt = new Date();
  const receivedAtText = formatParisDate(receivedAt);
  const scope = details || "Toute la commande";

  const nodemailerModule = await import("nodemailer");
  const nodemailer = nodemailerModule?.default || nodemailerModule;
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPass } });

  /* 1. Accusé de réception au client (obligatoire : c'est lui qui conditionne le succès) */
  const customerText = [
    "Bonjour,",
    "",
    "Nous accusons réception de votre demande de rétractation.",
    "",
    `Reçue le : ${receivedAtText}`,
    `Commande : ${orderRef}`,
    `Articles concernés : ${scope}`,
    `Email : ${email}`,
    "",
    "Et maintenant ?",
    "- Si votre commande n'est pas encore partie, je l'annule et vous rembourse.",
    "- Si vous l'avez reçue, je vous envoie l'adresse de retour. Vous disposez de 14 jours",
    "  pour renvoyer les articles ; les frais de retour sont à votre charge.",
    "- Le remboursement (frais de livraison initiaux compris) est effectué au plus tard",
    "  14 jours après réception de votre demande, et peut attendre le retour des articles",
    "  ou la preuve de leur expédition.",
    "",
    "Les produits personnalisés (prénom, motif sur mesure…) ne sont pas concernés par le droit de rétractation.",
    "",
    "Gardez cet email : il fait foi de votre demande.",
    "",
    "Les Points Rebelles",
  ].join("\n");

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      replyTo: adminEmail,
      subject: "Accusé de réception de votre rétractation — Les Points Rebelles",
      text: customerText,
    });
  } catch (err) {
    return json(502, { error: "ack_send_failed", message: err?.message || "unknown_error" });
  }

  /* 2. Enregistrement + 3. alerte admin (ne bloquent pas la réponse au client) */
  const saved = await saveToSupabase({
    email,
    order_ref: orderRef,
    details: details || null,
    received_at: receivedAt.toISOString(),
    ack_sent: true,
  });

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject: `[LPS] ⚠️ Demande de rétractation — commande ${orderRef}`,
      text: [
        "Un client a utilisé « Renoncer au contrat ici ».",
        "",
        `Reçue le : ${receivedAtText}`,
        `Email : ${email}`,
        `Commande : ${orderRef}`,
        `Articles concernés : ${scope}`,
        "",
        "L'accusé de réception automatique lui a été envoyé.",
        saved.ok ? "Demande enregistrée dans Supabase (withdrawal_requests)." : `⚠️ Enregistrement Supabase échoué : ${saved.error}`,
        "",
        "À faire : vérifier la commande, envoyer l'adresse de retour si besoin, rembourser sous 14 jours.",
      ].join("\n"),
    });
  } catch {
    /* L'accusé de réception est parti : on ne fait pas échouer la demande du client */
  }

  return json(200, { ok: true, receivedAt: receivedAt.toISOString(), receivedAtText });
};
