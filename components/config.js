/* ── Configuration partagée ─────────────────── */

let PAYPAL_CLIENT_ID =
  (typeof window !== "undefined" && window.__LPS_PAYPAL_CLIENT_ID__) || "";

const PRODUCT_BASE_EUR = {
  petit: { kit: 10, fini: 18 },
  grand: { kit: 20, fini: 32 },
  chat: { kit: 14, fini: 25 },
};

const OPTION_FEES = {
  bicoloreKit: 2,
  bicoloreFini: 4,
  prenomKit: 3,
  prenomFini: 5,
};

let SHIPPING_EUR = 3.5;
const SHIPPING_METHODS = {
  ship: "ship",
  pickup: "pickup",
};
const PICKUP_LABEL = "Retrait atelier Les Sorinières";
const PICKUP_CITY = "Les Sorinières";

const PAYPAL_BOX_LINKS = {
  aboMensuel: {
    kind: "subscribe",
    url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6U9022504A2672356NHOSYVA",
  },
  aboBiMensuel: {
    kind: "subscribe",
    url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-2TS26772XT5333600NHZ3NRA",
  },
  abo3Mois: { kind: "once", url: "#" },
};

const CONTACT_EMAIL = "lespointsrebelles@gmail.com";
const SUPABASE_URL = "https://mjegipjdnwcseunsmoyu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MI3d_8ZFg5eKhWAADfpyvA_6dnc9w8n";

const PRODUCT_LABELS = {
  petit: "Petit mot",
  grand: "Grand mot",
  chat: "Petit chat qui dort",
  "gift-card": "Carte cadeau",
  abo3Mois: "Box broderie — 3 mois · paiement unique (cadeau)",
  aboBiMensuel: "Abonnement box — 1 box tous les 2 mois",
  aboMensuel: "Abonnement box — 1 box par mois",
  "oreilles-chat": "Cercle oreilles de chat",
  "stand-triangle": "Stand triangle",
};

const FORMAT_LABELS = {
  kit: "Kit DIY",
  fini: "Broderie finie",
};

const PHRASES_PETIT = ["Merde", "Putain", "Ba super"];
const PHRASES_GRAND = ["Sauf erreur de ma part", "Pas là pour plaire"];
const ORDER_CART_STORAGE_KEY = "lps-order-cart-v1";
/** Prix affiché de la box mensuelle (réglable via Supabase price_key box.aboMensuel) */
let BOX_MONTHLY_EUR = 19.5;
const BOX_ONE_SHOT_EUR = {
  abo3Mois: 49.5,
};
const ACCESSORY_PRODUCTS = {
  "oreilles-chat": { label: "Cercle oreilles de chat (PLA)", price: 5.0 },
  "stand-triangle": { label: "Stand triangle (PLA)", price: 3.0 },
};

const FOURRURE_LABELS = {
  noir: "Noir",
  blanc: "Blanc",
  roux: "Roux / ginger",
  gris: "Gris",
  bleu_gris: "Bleu-gris",
  bicolore: "Bicolore (supplément)",
};

let activePromoCode = null;

const BASELINE_PRICING = {
  PRODUCT_BASE_EUR: JSON.parse(JSON.stringify(PRODUCT_BASE_EUR)),
  OPTION_FEES: JSON.parse(JSON.stringify(OPTION_FEES)),
  BOX_MONTHLY_EUR,
  BOX_ONE_SHOT_EUR: JSON.parse(JSON.stringify(BOX_ONE_SHOT_EUR)),
  ACCESSORY_PRODUCTS: {
    "oreilles-chat": ACCESSORY_PRODUCTS["oreilles-chat"]?.price ?? 5,
    "stand-triangle": ACCESSORY_PRODUCTS["stand-triangle"]?.price ?? 3,
  },
  SHIPPING_EUR,
};

function resetPricingToBaseline() {
  Object.assign(PRODUCT_BASE_EUR.petit, BASELINE_PRICING.PRODUCT_BASE_EUR.petit);
  Object.assign(PRODUCT_BASE_EUR.grand, BASELINE_PRICING.PRODUCT_BASE_EUR.grand);
  Object.assign(PRODUCT_BASE_EUR.chat, BASELINE_PRICING.PRODUCT_BASE_EUR.chat);
  Object.assign(OPTION_FEES, BASELINE_PRICING.OPTION_FEES);
  BOX_MONTHLY_EUR = BASELINE_PRICING.BOX_MONTHLY_EUR;
  Object.assign(BOX_ONE_SHOT_EUR, BASELINE_PRICING.BOX_ONE_SHOT_EUR);
  if (ACCESSORY_PRODUCTS["oreilles-chat"]) ACCESSORY_PRODUCTS["oreilles-chat"].price = BASELINE_PRICING.ACCESSORY_PRODUCTS["oreilles-chat"];
  if (ACCESSORY_PRODUCTS["stand-triangle"]) ACCESSORY_PRODUCTS["stand-triangle"].price = BASELINE_PRICING.ACCESSORY_PRODUCTS["stand-triangle"];
  SHIPPING_EUR = BASELINE_PRICING.SHIPPING_EUR;
}

function applyPriceRule(priceKey, amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return;
  if (priceKey === "shipping") {
    SHIPPING_EUR = n;
    return;
  }
  if (priceKey === "option.bicolore.kit") return void (OPTION_FEES.bicoloreKit = n);
  if (priceKey === "option.bicolore.fini") return void (OPTION_FEES.bicoloreFini = n);
  if (priceKey === "option.prenom.kit") return void (OPTION_FEES.prenomKit = n);
  if (priceKey === "option.prenom.fini") return void (OPTION_FEES.prenomFini = n);
  if (priceKey === "box.aboMensuel") return void (BOX_MONTHLY_EUR = n);
  if (priceKey === "box.abo3Mois") return void (BOX_ONE_SHOT_EUR.abo3Mois = n);
  if (priceKey === "accessory.oreilles-chat" && ACCESSORY_PRODUCTS["oreilles-chat"]) {
    ACCESSORY_PRODUCTS["oreilles-chat"].price = n;
    return;
  }
  if (priceKey === "accessory.stand-triangle" && ACCESSORY_PRODUCTS["stand-triangle"]) {
    ACCESSORY_PRODUCTS["stand-triangle"].price = n;
    return;
  }
  const parts = String(priceKey || "").split(".");
  if (parts.length === 3 && parts[0] === "product" && PRODUCT_BASE_EUR[parts[1]] && PRODUCT_BASE_EUR[parts[1]][parts[2]] != null) {
    PRODUCT_BASE_EUR[parts[1]][parts[2]] = n;
  }
}

function applyPriceRules(rows) {
  (rows || []).forEach((row) => applyPriceRule(row.price_key, row.amount_eur));
}

function getSharedSupabaseClient() {
  if (!window.supabase?.createClient || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const existing = window.__LPS_SUPABASE_CLIENT__;
  if (existing) return existing;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__LPS_SUPABASE_CLIENT__ = client;
  return client;
}

async function loadPricingFromSupabase() {
  const client = getSharedSupabaseClient();
  if (!client) return { ok: false, reason: "missing_supabase" };
  try {
    const { data, error } = await client
      .from("price_rules")
      .select("price_key,amount_eur")
      .eq("scope", "site")
      .eq("scope_id", "default");
    if (error) return { ok: false, reason: error.message };
    resetPricingToBaseline();
    applyPriceRules(data || []);
    BASELINE_PRICING.PRODUCT_BASE_EUR = JSON.parse(JSON.stringify(PRODUCT_BASE_EUR));
    BASELINE_PRICING.OPTION_FEES = JSON.parse(JSON.stringify(OPTION_FEES));
    BASELINE_PRICING.BOX_MONTHLY_EUR = BOX_MONTHLY_EUR;
    BASELINE_PRICING.BOX_ONE_SHOT_EUR = JSON.parse(JSON.stringify(BOX_ONE_SHOT_EUR));
    BASELINE_PRICING.ACCESSORY_PRODUCTS = {
      "oreilles-chat": ACCESSORY_PRODUCTS["oreilles-chat"]?.price ?? 5,
      "stand-triangle": ACCESSORY_PRODUCTS["stand-triangle"]?.price ?? 3,
    };
    BASELINE_PRICING.SHIPPING_EUR = SHIPPING_EUR;
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.message || "pricing_load_failed" };
  }
}

async function applyPromoCode(codeRaw) {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "empty_code" };
  const client = getSharedSupabaseClient();
  if (!client) return { ok: false, reason: "missing_supabase" };
  try {
    const { data: promo, error } = await client
      .from("promo_codes")
      .select("code,is_active,add1_month,starts_at,ends_at")
      .eq("code", code)
      .maybeSingle();
    if (error) return { ok: false, reason: error.message };
    if (!promo || !promo.is_active) return { ok: false, reason: "invalid_code" };
    const now = new Date();
    if (promo.starts_at && now < new Date(promo.starts_at)) return { ok: false, reason: "not_started" };
    if (promo.ends_at && now > new Date(promo.ends_at)) return { ok: false, reason: "expired" };
    const { data: rules, error: rulesError } = await client
      .from("price_rules")
      .select("price_key,amount_eur")
      .eq("scope", "promo")
      .eq("scope_id", code);
    if (rulesError) return { ok: false, reason: rulesError.message };
    resetPricingToBaseline();
    applyPriceRules(rules || []);
    activePromoCode = code;
    return { ok: true, code, add1Month: Boolean(promo.add1_month), hasPricingRules: (rules || []).length > 0 };
  } catch (err) {
    return { ok: false, reason: err?.message || "promo_apply_failed" };
  }
}

function clearPromoCode() {
  resetPricingToBaseline();
  activePromoCode = null;
  return { ok: true };
}

function getActivePromoCode() {
  return activePromoCode;
}

function getPayPalClientId() {
  return PAYPAL_CLIENT_ID || "";
}

async function loadPayPalClientIdFromNetlify() {
  if (PAYPAL_CLIENT_ID) return { ok: true, source: "window", clientId: PAYPAL_CLIENT_ID };
  try {
    const response = await fetch("/.netlify/functions/runtime-config", { method: "GET" });
    if (!response.ok) return { ok: false, reason: "runtime_config_http_error" };
    const data = await response.json();
    const clientId = String(data?.paypalClientId || "").trim();
    if (!clientId) return { ok: false, reason: "runtime_config_empty" };
    PAYPAL_CLIENT_ID = clientId;
    if (typeof window !== "undefined") {
      window.__LPS_PAYPAL_CLIENT_ID__ = clientId;
    }
    return { ok: true, source: "runtime_function", clientId };
  } catch (err) {
    return { ok: false, reason: err?.message || "runtime_config_fetch_failed" };
  }
}

if (typeof window !== "undefined") {
  window.loadPricingFromSupabase = loadPricingFromSupabase;
  window.applyPromoCode = applyPromoCode;
  window.clearPromoCode = clearPromoCode;
  window.getActivePromoCode = getActivePromoCode;
  window.getPayPalClientId = getPayPalClientId;
  window.loadPayPalClientIdFromNetlify = loadPayPalClientIdFromNetlify;
}
