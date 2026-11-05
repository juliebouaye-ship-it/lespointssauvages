/* ── Configuration partagée ─────────────────── */

let PAYPAL_CLIENT_ID =
  (typeof window !== "undefined" && window.__LPS_PAYPAL_CLIENT_ID__) || "";

/* Produits et phrases : components/catalog.js.
   PRIX : uniquement dans Supabase (table price_rules, scope 'site' / 'default').
   Tant qu'ils ne sont pas chargés, tous les montants valent null et aucune
   commande payante n'est possible (voir isPricingReady). */
const CATALOG_PRODUCTS = (typeof LPS_CATALOG !== "undefined" && LPS_CATALOG.products) || {};
const catalogEntriesOfType = (type) => Object.entries(CATALOG_PRODUCTS).filter(([, p]) => p.type === type);

/* { petit: { kit: null, fini: null }, … } — rempli par Supabase */
const PRODUCT_BASE_EUR = Object.fromEntries(
  catalogEntriesOfType("broderie").map(([id, p]) => [
    id,
    Object.fromEntries((p.formats || ["kit", "fini"]).map((f) => [f, null])),
  ])
);

const OPTION_FEES = {
  bicoloreKit: null,
  bicoloreFini: null,
  prenomKit: null,
  prenomFini: null,
};

let SHIPPING_EUR = null;
/** true une fois les prix Supabase chargés (et la livraison connue) */
let PRICING_LOADED = false;
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
  ...Object.fromEntries(Object.entries(CATALOG_PRODUCTS).map(([id, p]) => [id, p.cartLabel || p.label])),
  "gift-card": "Carte cadeau",
  abo3Mois: "Box broderie — 3 mois · paiement unique (cadeau)",
  aboBiMensuel: "Abonnement box — 1 box tous les 2 mois",
  aboMensuel: "Abonnement box — 1 box par mois",
};

const FORMAT_LABELS = {
  kit: "Kit DIY",
  fini: "Broderie finie",
};

const PHRASES_PETIT = CATALOG_PRODUCTS.petit?.phrases || [];
const PHRASES_GRAND = CATALOG_PRODUCTS.grand?.phrases || [];
const ORDER_CART_STORAGE_KEY = "lps-order-cart-v1";
/** Prix de la box mensuelle : Supabase price_key box.aboMensuel */
let BOX_MONTHLY_EUR = null;

const BOX_ONE_SHOT_EUR = {
  abo3Mois: null,
};
const ACCESSORY_PRODUCTS = Object.fromEntries(
  catalogEntriesOfType("accessoire").map(([id, p]) => [id, { label: p.cartLabel || p.label, price: null }])
);
const snapshotAccessoryPrices = () =>
  Object.fromEntries(Object.entries(ACCESSORY_PRODUCTS).map(([id, a]) => [id, a.price]));

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
  ACCESSORY_PRODUCTS: snapshotAccessoryPrices(),
  SHIPPING_EUR,
};

function resetPricingToBaseline() {
  Object.keys(PRODUCT_BASE_EUR).forEach((id) => {
    Object.assign(PRODUCT_BASE_EUR[id], BASELINE_PRICING.PRODUCT_BASE_EUR[id]);
  });
  Object.assign(OPTION_FEES, BASELINE_PRICING.OPTION_FEES);
  BOX_MONTHLY_EUR = BASELINE_PRICING.BOX_MONTHLY_EUR;
  Object.assign(BOX_ONE_SHOT_EUR, BASELINE_PRICING.BOX_ONE_SHOT_EUR);
  Object.entries(BASELINE_PRICING.ACCESSORY_PRODUCTS).forEach(([id, price]) => {
    if (ACCESSORY_PRODUCTS[id]) ACCESSORY_PRODUCTS[id].price = price;
  });
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
  if (String(priceKey).startsWith("accessory.")) {
    const accessory = ACCESSORY_PRODUCTS[String(priceKey).slice("accessory.".length)];
    if (accessory) accessory.price = n;
    return;
  }
  const parts = String(priceKey || "").split(".");
  if (
    parts.length === 3 &&
    parts[0] === "product" &&
    PRODUCT_BASE_EUR[parts[1]] &&
    Object.prototype.hasOwnProperty.call(PRODUCT_BASE_EUR[parts[1]], parts[2])
  ) {
    PRODUCT_BASE_EUR[parts[1]][parts[2]] = n;
  }
}

const isPrice = (value) => typeof value === "number" && Number.isFinite(value);

/** Prix chargés depuis Supabase : sinon, aucune commande payante. */
function isPricingReady() {
  return PRICING_LOADED && isPrice(SHIPPING_EUR);
}

/** Clés de prix attendues mais absentes de Supabase (affichées en console pour l'admin). */
function listMissingPriceKeys() {
  const missing = [];
  Object.entries(PRODUCT_BASE_EUR).forEach(([id, formats]) => {
    Object.entries(formats).forEach(([f, v]) => {
      if (!isPrice(v)) missing.push(`product.${id}.${f}`);
    });
  });
  Object.entries(ACCESSORY_PRODUCTS).forEach(([id, a]) => {
    if (!isPrice(a.price)) missing.push(`accessory.${id}`);
  });
  [
    ["option.bicolore.kit", OPTION_FEES.bicoloreKit],
    ["option.bicolore.fini", OPTION_FEES.bicoloreFini],
    ["option.prenom.kit", OPTION_FEES.prenomKit],
    ["option.prenom.fini", OPTION_FEES.prenomFini],
    ["box.aboMensuel", BOX_MONTHLY_EUR],
    ["box.abo3Mois", BOX_ONE_SHOT_EUR.abo3Mois],
    ["shipping", SHIPPING_EUR],
  ].forEach(([key, v]) => {
    if (!isPrice(v)) missing.push(key);
  });
  return missing;
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
    BASELINE_PRICING.ACCESSORY_PRODUCTS = snapshotAccessoryPrices();
    BASELINE_PRICING.SHIPPING_EUR = SHIPPING_EUR;
    PRICING_LOADED = true;
    const missing = listMissingPriceKeys();
    if (missing.length) console.warn("Prix absents de Supabase (price_rules) :", missing.join(", "));
    return { ok: true, missing };
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
  window.isPricingReady = isPricingReady;
  window.applyPromoCode = applyPromoCode;
  window.clearPromoCode = clearPromoCode;
  window.getActivePromoCode = getActivePromoCode;
  window.getPayPalClientId = getPayPalClientId;
  window.loadPayPalClientIdFromNetlify = loadPayPalClientIdFromNetlify;
}
