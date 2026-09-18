/**
 * Mini backoffice merceries : connexion par mot de passe + saisie des kits vendus.
 *
 * Tout passe par cette fonction (cle service_role, serveur uniquement) : les tables
 * `merceries` et `mercerie_sales` ne sont PAS lisibles avec la cle anon publique.
 *
 * Variables Netlify a definir :
 * - SUPABASE_URL                     (deja utilisee par stand-orders-list)
 * - SUPABASE_SERVICE_ROLE_KEY        (secret - jamais dans le repo)
 * - LPS_MERCERIE_SESSION_SECRET      (secret fort : signe les jetons de session)
 * - LPS_MERCERIE_ADMIN_TOKEN         (optionnel : mot de passe admin, voit toutes les merceries)
 *
 * Actions (POST JSON) : login, session, list, record, remove, shops.
 */

import { createHmac, pbkdf2Sync, randomUUID, timingSafeEqual } from "node:crypto";

/** Catalogue autorise : ajouter une ligne ici suffit pour proposer un nouveau kit. */
const CATALOG = [
  { key: "petit", format: "kit", label: "Kit Petit mot", defaultPrice: 10 },
  { key: "grand", format: "kit", label: "Kit Grand mot", defaultPrice: 20 },
  { key: "chat", format: "kit", label: "Kit Petit chat qui dort", defaultPrice: 14 },
];

const SESSION_TTL_SECONDS = 12 * 60 * 60;
const DEFAULT_ITERATIONS = 150000;
const MAX_FAILED_LOGINS = 10;
const FAILED_LOGIN_WINDOW_MS = 10 * 60 * 1000;

/** Anti-brute force "best effort" : en memoire, donc par instance de fonction. */
const failedLogins = new Map();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(statusCode, payload) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(payload) };
}

function base64url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value) {
  const padded = String(value).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded + "=".repeat((4 - (padded.length % 4)) % 4), "base64");
}

function safeEquals(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function signSession(payload, secret) {
  const body = base64url(JSON.stringify(payload));
  const mac = base64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${mac}`;
}

function readSession(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  const expected = base64url(createHmac("sha256", secret).update(body).digest());
  if (!safeEquals(mac, expected)) return null;
  let payload;
  try {
    payload = JSON.parse(fromBase64url(body).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

function hashPassword(password, salt, iterations) {
  return pbkdf2Sync(String(password), String(salt), Number(iterations) || DEFAULT_ITERATIONS, 32, "sha256").toString("hex");
}

function clientIp(event) {
  const headers = event.headers || {};
  const forwarded = headers["x-nf-client-connection-ip"] || headers["x-forwarded-for"] || "";
  return String(forwarded).split(",")[0].trim() || "unknown";
}

function tooManyFailures(ip) {
  const entry = failedLogins.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > FAILED_LOGIN_WINDOW_MS) {
    failedLogins.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_LOGINS;
}

function rememberFailure(ip) {
  // Garde-fou memoire : la Map ne doit pas grossir indefiniment sur une instance longue.
  if (failedLogins.size > 500) failedLogins.clear();
  const entry = failedLogins.get(ip);
  if (!entry || Date.now() - entry.first > FAILED_LOGIN_WINDOW_MS) {
    failedLogins.set(ip, { count: 1, first: Date.now() });
    return;
  }
  entry.count += 1;
}

function catalogEntry(key, format) {
  return CATALOG.find((item) => item.key === key && item.format === (format || "kit")) || null;
}

function publicCatalog() {
  return CATALOG.map(({ key, format, label, defaultPrice }) => ({ key, format, label, defaultPrice }));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(Date.parse(value));
}

function isIsoMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""));
}

function monthBounds(month) {
  const [year, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(m === 12 ? year + 1 : year, m === 12 ? 0 : m, 1));
  return { start, end: endDate.toISOString().slice(0, 10) };
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/* ── Supabase REST (service_role) ─────────────── */

function supabaseConfig() {
  const baseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  return baseUrl && serviceKey ? { baseUrl, serviceKey } : null;
}

async function supabaseRequest(path, { method = "GET", searchParams = {}, body, prefer } = {}) {
  const config = supabaseConfig();
  if (!config) throw new Error("Server misconfigured (missing Supabase secrets)");

  const url = new URL(`${config.baseUrl}/rest/v1/${path}`);
  Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid Supabase response: ${text.slice(0, 200)}`);
    }
  }
  if (!res.ok) {
    const detail = data?.message || data?.error || res.statusText;
    const err = new Error(String(detail));
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ── Actions ──────────────────────────────────── */

async function handleLogin(payload, event, sessionSecret) {
  const ip = clientIp(event);
  if (tooManyFailures(ip)) {
    return json(429, { error: "Trop de tentatives. Réessayez dans quelques minutes." });
  }

  const password = String(payload.password || "").trim();
  if (!password) return json(400, { error: "Mot de passe manquant." });

  const adminToken = String(process.env.LPS_MERCERIE_ADMIN_TOKEN || "");
  if (adminToken && safeEquals(password, adminToken)) {
    const session = { role: "admin", name: "Atelier (admin)", sid: randomUUID(), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
    return json(200, {
      token: signSession(session, sessionSecret),
      identity: { role: "admin", name: session.name },
      catalog: publicCatalog(),
    });
  }

  const shops = await supabaseRequest("merceries", {
    searchParams: {
      select: "id,name,city,password_salt,password_hash,password_iterations",
      is_active: "eq.true",
      order: "id.asc",
      limit: "200",
    },
  });

  let matched = null;
  for (const shop of Array.isArray(shops) ? shops : []) {
    const computed = hashPassword(password, shop.password_salt, shop.password_iterations);
    if (safeEquals(computed, shop.password_hash)) {
      matched = shop;
      break;
    }
  }

  if (!matched) {
    rememberFailure(ip);
    return json(401, { error: "Mot de passe inconnu." });
  }

  failedLogins.delete(ip);
  const session = {
    role: "shop",
    shopId: matched.id,
    name: matched.name,
    city: matched.city || "",
    sid: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  return json(200, {
    token: signSession(session, sessionSecret),
    identity: { role: "shop", name: matched.name, city: matched.city || "" },
    catalog: publicCatalog(),
  });
}

async function listShops() {
  const shops = await supabaseRequest("merceries", {
    searchParams: { select: "id,name,city,is_active", order: "name.asc", limit: "200" },
  });
  // Remappage explicite : rien d'autre que ces colonnes ne doit sortir de la fonction.
  return (Array.isArray(shops) ? shops : []).map((shop) => ({
    id: shop.id,
    name: shop.name,
    city: shop.city || "",
    is_active: shop.is_active !== false,
  }));
}

async function handleList(payload, session) {
  const month = isIsoMonth(payload.month) ? payload.month : currentMonth();
  const { start, end } = monthBounds(month);

  const searchParams = {
    select: "id,sold_on,product_key,product_label,format,quantity,unit_price_eur,total_eur,note,mercerie_id",
    and: `(sold_on.gte.${start},sold_on.lt.${end})`,
    order: "sold_on.desc,id.desc",
    limit: "500",
  };

  let shops = [];
  if (session.role === "admin") {
    shops = await listShops();
    const filterId = Number(payload.shopId);
    if (Number.isInteger(filterId) && filterId > 0) {
      searchParams.mercerie_id = `eq.${filterId}`;
    }
  } else {
    searchParams.mercerie_id = `eq.${session.shopId}`;
  }

  const rows = await supabaseRequest("mercerie_sales", { searchParams });
  const shopNames = new Map(shops.map((shop) => [shop.id, shop.name]));

  return json(200, {
    month,
    identity: {
      role: session.role,
      name: session.name,
      city: session.city || "",
    },
    catalog: publicCatalog(),
    shops: session.role === "admin" ? shops : [],
    rows: (Array.isArray(rows) ? rows : []).map((row) => ({
      ...row,
      shop_name: session.role === "admin" ? shopNames.get(row.mercerie_id) || `#${row.mercerie_id}` : session.name,
    })),
  });
}

async function handleRecord(payload, session) {
  if (session.role !== "shop") {
    return json(403, { error: "Le compte admin est en lecture seule : connectez-vous avec le mot de passe d'une mercerie." });
  }

  const soldOn = isIsoDate(payload.soldOn) ? payload.soldOn : new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (soldOn > today) return json(400, { error: "La date de vente ne peut pas être dans le futur." });

  const note = String(payload.note || "").trim().slice(0, 500) || null;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const rows = [];

  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) continue;
    if (quantity > 999) return json(400, { error: "Quantité trop grande (999 maximum par ligne)." });

    const entry = catalogEntry(item?.productKey, item?.format);
    if (!entry) return json(400, { error: `Produit inconnu : ${String(item?.productKey || "")}` });

    const rawPrice = item?.unitPrice;
    const unitPrice = rawPrice === undefined || rawPrice === null || rawPrice === "" ? entry.defaultPrice : Number(rawPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 9999) {
      return json(400, { error: "Prix unitaire invalide." });
    }

    rows.push({
      mercerie_id: session.shopId,
      sold_on: soldOn,
      product_key: entry.key,
      product_label: entry.label,
      format: entry.format,
      quantity,
      unit_price_eur: Number(unitPrice.toFixed(2)),
      note,
    });
  }

  if (!rows.length) return json(400, { error: "Aucune quantité saisie." });

  await supabaseRequest("mercerie_sales", { method: "POST", body: rows, prefer: "return=minimal" });
  return json(200, { ok: true, inserted: rows.length });
}

async function handleRemove(payload, session) {
  const id = Number(payload.id);
  if (!Number.isInteger(id) || id <= 0) return json(400, { error: "Ligne introuvable." });

  const searchParams = { id: `eq.${id}` };
  if (session.role !== "admin") searchParams.mercerie_id = `eq.${session.shopId}`;

  const deleted = await supabaseRequest("mercerie_sales", {
    method: "DELETE",
    searchParams,
    prefer: "return=representation",
  });

  if (!Array.isArray(deleted) || !deleted.length) {
    return json(404, { error: "Ligne introuvable (ou déjà supprimée)." });
  }
  return json(200, { ok: true });
}

/* ── Handler ──────────────────────────────────── */

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const sessionSecret = String(process.env.LPS_MERCERIE_SESSION_SECRET || "");
  if (!sessionSecret) {
    return json(500, { error: "Server misconfigured (LPS_MERCERIE_SESSION_SECRET manquant)" });
  }
  if (!supabaseConfig()) {
    return json(500, { error: "Server misconfigured (missing Supabase secrets)" });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Corps de requête invalide." });
  }

  const action = String(payload.action || "").trim();

  try {
    if (action === "login") return await handleLogin(payload, event, sessionSecret);

    const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = readSession(token, sessionSecret);
    if (!session) return json(401, { error: "Session expirée ou invalide." });

    if (action === "session") {
      return json(200, {
        identity: { role: session.role, name: session.name, city: session.city || "" },
        catalog: publicCatalog(),
      });
    }
    if (action === "list") return await handleList(payload, session);
    if (action === "record") return await handleRecord(payload, session);
    if (action === "remove") return await handleRemove(payload, session);

    return json(400, { error: `Action inconnue : ${action}` });
  } catch (err) {
    const status = Number(err?.status) >= 400 && Number(err?.status) < 600 ? Number(err.status) : 502;
    return json(status, { error: err?.message || "Erreur serveur." });
  }
};
