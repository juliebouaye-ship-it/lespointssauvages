/* ── Configuration partagée ─────────────────── */

const PAYPAL_CLIENT_ID_FALLBACK =
  "AT6mRRcUsZXuZtJBYpnyVTTQieUpW7kUboKftgVS_0bBH2VU14BlOaH-fzqIyeKLYwa8NQk-DZxvxlsm";
const PAYPAL_CLIENT_ID =
  (typeof window !== "undefined" && window.__LPS_PAYPAL_CLIENT_ID__) || PAYPAL_CLIENT_ID_FALLBACK;

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

const SHIPPING_EUR = 3.5;
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
  abo3Mois: { kind: "once", url: "#" },
  aboAnnee: { kind: "once", url: "#" },
};

const CONTACT_EMAIL = "lespointssauvages@gmail.com";
const SUPABASE_URL = "https://mjegipjdnwcseunsmoyu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MI3d_8ZFg5eKhWAADfpyvA_6dnc9w8n";

const PRODUCT_LABELS = {
  petit: "Petit mot",
  grand: "Grand mot",
  chat: "Petit chat qui dort",
  abo3Mois: "Box broderie 3 mois",
  aboAnnee: "Box broderie 1 an",
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
const BOX_ONE_SHOT_EUR = {
  abo3Mois: 51.5,
  aboAnnee: 191.5,
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
