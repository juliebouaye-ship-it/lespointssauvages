/* ═══════════════════════════════════════════════
   Les Points Sauvages — script.js
   ═══════════════════════════════════════════════ */

/* ── Configuration ──────────────────────────── */

/**
 * Client ID PayPal (identifiant public pour le SDK navigateur — ce n’est pas le secret).
 * Le secret ne sert qu’en backend ; pas besoin de variable Netlify pour ce site statique.
 * Évitez tout de même de publier le repo en public sans réfléchir : préférez un repo privé
 * ou une injection au build si vous voulez retirer l’ID du fichier versionné.
 */
const PAYPAL_CLIENT_ID = "AX-WHqwbPaCEdwVrSjEEdhV-cCM2wtFY1WvUmsHSKtPzMdjmcH4vJFbpmWeB-xv9h9O40GcNlkp6N0sB";

/**
 * Prix de base (€) — à ajuster selon votre grille tarifaire.
 * Les suppléments chat (bicolore, prénom) s'ajoutent via OPTION_FEES.
 */
const PRODUCT_BASE_EUR = {
  petit: { kit: 10, fini: 18 },
  grand: { kit: 20, fini: 32 },
  chat: { kit: 14, fini: 25 },
};

/** Suppléments pour le motif « Petit chat qui dort » */
const OPTION_FEES = {
  bicoloreKit: 2,
  bicoloreFini: 4,
  prenomKit: 3,
  prenomFini: 5,
};

/** Livraison ajoutée à chaque commande passée via la modale (PayPal ou email). */
const SHIPPING_EUR = 3.5;

/**
 * PayPal : mensuel = abonnement (plan) ; 3 mois / 1 an = paiement unique (lien bouton ou facture PayPal).
 * Remplacez les `#` par vos liens « Acheter maintenant » / paiement unique une fois créés dans PayPal.
 */
const PAYPAL_BOX_LINKS = {
  aboMensuel: {
    kind: "subscribe",
    url: "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6U9022504A2672356NHOSYVA",
  },
  abo3Mois: { kind: "once", url: "#" },
  aboAnnee: { kind: "once", url: "#" },
};

const CONTACT_EMAIL = "lespointssauvages@gmail.com";
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

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

let supabaseClient = null;

function formatEuro(amount) {
  return `${Number(amount).toFixed(2).replace(".", ",")} €`;
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!window.supabase?.createClient) return null;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function insertSupabase(table, payload) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, missingConfig: true };
  const { error } = await client.from(table).insert(payload);
  if (error) return { ok: false, error };
  return { ok: true };
}

function getShippingState() {
  return {
    fullName: document.getElementById("shipping-fullname")?.value.trim() || "",
    email: document.getElementById("shipping-email")?.value.trim() || "",
    phone: document.getElementById("shipping-phone")?.value.trim() || "",
    address1: document.getElementById("shipping-address1")?.value.trim() || "",
    address2: document.getElementById("shipping-address2")?.value.trim() || "",
    postalCode: document.getElementById("shipping-postal")?.value.trim() || "",
    city: document.getElementById("shipping-city")?.value.trim() || "",
    notes: document.getElementById("shipping-notes")?.value.trim() || "",
  };
}

function validateShippingState(state) {
  return Boolean(state.fullName && state.email && state.address1 && state.postalCode && state.city);
}

async function persistOrderToSupabase(capture, lines, total, shipping) {
  const payload = {
    paypal_order_id: capture?.id || null,
    paypal_status: capture?.status || null,
    payer_email: capture?.payer?.email_address || shipping.email || null,
    payer_name: capture?.payer?.name
      ? `${capture.payer.name.given_name || ""} ${capture.payer.name.surname || ""}`.trim()
      : shipping.fullName || null,
    amount_total: total,
    shipping_fee: SHIPPING_EUR,
    shipping_full_name: shipping.fullName,
    shipping_email: shipping.email,
    shipping_phone: shipping.phone || null,
    shipping_address_1: shipping.address1,
    shipping_address_2: shipping.address2 || null,
    shipping_postal_code: shipping.postalCode,
    shipping_city: shipping.city,
    shipping_notes: shipping.notes || null,
    cart_lines: lines,
  };
  return insertSupabase("orders", payload);
}

function setModalState(element, isOpen) {
  if (!element) return;
  element.classList.toggle("is-open", isOpen);
  element.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

function updatePhraseLabel() {
  const label = document.getElementById("order-phrase-label");
  const product = document.getElementById("order-product")?.value;
  if (!label) return;
  const req = '<span class="required" aria-hidden="true">*</span>';
  if (product === "petit") {
    label.innerHTML = `Choisissez votre mot ${req}`;
  } else if (product === "grand") {
    label.innerHTML = `Choisissez votre phrase ${req}`;
  } else {
    label.innerHTML = `Phrase brodée ${req}`;
  }
}

function populatePhraseSelect() {
  const product = document.getElementById("order-product")?.value;
  const sel = document.getElementById("order-phrase");
  if (!sel) return;
  updatePhraseLabel();
  const prev = sel.value;
  sel.innerHTML = "";
  const list = product === "petit" ? PHRASES_PETIT : product === "grand" ? PHRASES_GRAND : [];
  if (!list.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "—";
    sel.appendChild(opt);
    return;
  }
  for (const t of list) {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    sel.appendChild(o);
  }
  if (prev && list.includes(prev)) sel.value = prev;
  else sel.value = list[0];
}

/* ── PayPal SDK (commande modale) ───────────── */

let paypalSdkPromise = null;

function loadPayPalSdk(clientId) {
  if (!clientId) return Promise.reject(new Error("Missing PayPal client id"));
  if (paypalSdkPromise) return paypalSdkPromise;
  paypalSdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&intent=capture`;
    s.async = true;
    s.onload = () => resolve(window.paypal);
    s.onerror = () => reject(new Error("PayPal SDK load failed"));
    document.head.appendChild(s);
  });
  return paypalSdkPromise;
}

let orderPaypalButtons = null;
let orderPaypalRenderTimer = null;
let orderCart = [];

const CartStore = {
  load() {
    return loadOrderCart();
  },
  save() {
    saveOrderCart();
  },
  add(line) {
    orderCart.push(line);
    this.save();
  },
  removeAt(index) {
    orderCart.splice(index, 1);
    this.save();
  },
  clear() {
    orderCart = [];
    this.save();
  },
  hasItems() {
    return orderCart.length > 0;
  },
};

function loadOrderCart() {
  try {
    const raw = window.localStorage.getItem(ORDER_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((line) => ({
      ...line,
      quantity: Math.max(1, Number.parseInt(line.quantity || "1", 10) || 1),
    }));
  } catch {
    return [];
  }
}

function saveOrderCart() {
  try {
    window.localStorage.setItem(ORDER_CART_STORAGE_KEY, JSON.stringify(orderCart));
  } catch {
    /* ignore */
  }
}

/* ── Box PayPal (abonnement mensuel ou liens paiement unique) ───────────────── */

function wirePayPalBoxButtons() {
  document.querySelectorAll("[data-paypal]").forEach((btn) => {
    const key = btn.getAttribute("data-paypal");
    const entry = PAYPAL_BOX_LINKS[key];

    if (!entry?.url || entry.url === "#") {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("title", "Lien PayPal à configurer");
      btn.style.opacity = "0.55";
      btn.style.cursor = "not-allowed";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const msg =
          entry?.kind === "once"
            ? "Lien de paiement unique (3 mois / 1 an) à coller dans script.js — PayPal → boutons / lien de paiement 🔧"
            : "Lien PayPal à configurer dans script.js 🔧";
        showToast(msg);
      });
      return;
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (/^https?:\/\//i.test(entry.url)) {
        window.open(entry.url, "_blank", "noopener,noreferrer");
      }
    });
  });
}

/* ── Commande modale + calcul ───────────────── */

function getOrderState() {
  const product = document.getElementById("order-product")?.value || "";
  const format = document.getElementById("order-format")?.value || "";
  const phrase = document.getElementById("order-phrase")?.value.trim() || "";
  const fourrure = document.getElementById("order-fourrure")?.value || "";
  const bicolore = fourrure === "bicolore";
  const bicoloreDetail = document.getElementById("order-bicolore-detail")?.value.trim() || "";
  const prenomAddon = document.querySelector('input[name="order-prenom-addon"]:checked')?.value === "1";
  const prenom = document.getElementById("order-prenom")?.value.trim() || "";
  const photoLink = document.getElementById("order-photo-link")?.value.trim() || "";
  const commentaire = document.getElementById("order-commentaire")?.value.trim() || "";
  const quantity = Math.max(1, Number.parseInt(document.getElementById("order-qty")?.value || "1", 10) || 1);
  return {
    product,
    format,
    phrase,
    fourrure,
    bicolore,
    bicoloreDetail,
    prenomAddon,
    prenom,
    photoLink,
    commentaire,
    quantity,
  };
}

function computeSubtotalArticles(state) {
  const base = PRODUCT_BASE_EUR[state.product]?.[state.format];
  if (base == null) return null;
  let unit = base;
  if (state.product === "chat") {
    if (state.bicolore) {
      unit += state.format === "fini" ? OPTION_FEES.bicoloreFini : OPTION_FEES.bicoloreKit;
    }
    if (state.prenomAddon) {
      unit += state.format === "fini" ? OPTION_FEES.prenomFini : OPTION_FEES.prenomKit;
    }
  }
  return Math.round(unit * state.quantity * 100) / 100;
}

function computeTotalEur(state) {
  const sub = computeSubtotalArticles(state);
  if (sub == null) return null;
  return Math.round((sub + SHIPPING_EUR) * 100) / 100;
}

function validateOrder(state) {
  if (!state.product || !state.format) return false;
  if (state.product === "petit" || state.product === "grand") {
    return state.phrase.length > 0;
  }
  if (state.product === "chat") {
    if (!state.fourrure) return false;
    if (state.bicolore && !state.bicoloreDetail) return false;
    if (state.prenomAddon && !state.prenom) return false;
    return true;
  }
  return false;
}

function updatePillPriceHints() {
  const fmt = document.getElementById("order-format")?.value;
  const preHint = document.getElementById("order-prenom-price-hint");
  if (preHint) {
    if (fmt === "fini") preHint.textContent = `(+${OPTION_FEES.prenomFini} €)`;
    else if (fmt === "kit") preHint.textContent = `(+${OPTION_FEES.prenomKit} €)`;
    else preHint.textContent = "";
  }
}

function toggleChatFieldVisibility() {
  const fur = document.getElementById("order-fourrure")?.value || "";
  const isBicoloreFur = fur === "bicolore";
  const rowBio = document.getElementById("order-row-bicolore-detail");
  if (rowBio) {
    rowBio.hidden = !isBicoloreFur;
    if (!isBicoloreFur) {
      const ta = document.getElementById("order-bicolore-detail");
      if (ta) ta.value = "";
    }
  }

  const prenomAddon = document.querySelector('input[name="order-prenom-addon"]:checked')?.value === "1";
  const rowPre = document.getElementById("order-row-prenom");
  if (rowPre) {
    rowPre.hidden = !prenomAddon;
    if (!prenomAddon) {
      const inp = document.getElementById("order-prenom");
      if (inp) inp.value = "";
    }
  }

  updatePillPriceHints();
}

function syncOrderModalLayout() {
  const product = document.getElementById("order-product")?.value || "";
  const format = document.getElementById("order-format")?.value || "";
  const hasProduct = Boolean(product);
  const hasFormat = Boolean(format);

  const mot = document.getElementById("order-fields-mot");
  if (mot) mot.hidden = product !== "petit" && product !== "grand";

  const motHint = document.getElementById("order-mot-hint");
  const phraseRow = document.getElementById("order-row-phrase");
  const showMotPhrase = (product === "petit" || product === "grand") && hasFormat;
  if (motHint) motHint.hidden = !((product === "petit" || product === "grand") && !hasFormat);
  if (phraseRow) phraseRow.hidden = !showMotPhrase;

  const chatWrap = document.getElementById("order-fields-chat");
  if (chatWrap) chatWrap.hidden = product !== "chat";

  const chatHint = document.getElementById("order-chat-hint-format");
  const chatOpt = document.getElementById("order-chat-step-options");
  if (chatHint) chatHint.hidden = !(product === "chat" && !hasFormat);
  if (chatOpt) chatOpt.hidden = !(product === "chat" && hasFormat);

  const commentRow = document.getElementById("order-row-commentaire");
  if (commentRow) commentRow.hidden = !(hasProduct && hasFormat);

  const footerPanel = document.getElementById("order-footer-panel");
  if (footerPanel) footerPanel.hidden = !(hasProduct && hasFormat);

  if (product !== "chat") {
    const fur = document.getElementById("order-fourrure");
    if (fur) fur.value = "";
    document.getElementById("order-prenom-addon-no")?.click();
  }
  toggleChatFieldVisibility();
}

function buildMailtoBody(state, total) {
  const lines = [
    "Bonjour,",
    "",
    "Récapitulatif de commande :",
    "",
    `Produit : ${PRODUCT_LABELS[state.product] || state.product}`,
    `Format : ${FORMAT_LABELS[state.format] || state.format}`,
    `Quantite : ${state.quantity}`,
    `Montant TTC (articles + port ${SHIPPING_EUR} €) : ${total != null ? `${total} €` : "(à confirmer)"}`,
    "",
  ];
  if (state.product === "petit" || state.product === "grand") {
    lines.push(`Phrase : ${state.phrase || "-"}`);
  }
  if (state.product === "chat") {
    const furLabel = FOURRURE_LABELS[state.fourrure] || state.fourrure || "-";
    lines.push(`Fourrure : ${furLabel}`);
    lines.push(`Motif bicolore (fourrure) : ${state.bicolore ? "oui" : "non"}`);
    if (state.bicolore) lines.push(`Précisions bicolore : ${state.bicoloreDetail || "-"}`);
    lines.push(`Prénom sur tambour : ${state.prenomAddon ? state.prenom || "-" : "non"}`);
    lines.push(`Lien photo : ${state.photoLink || "-"}`);
  }
  lines.push(`Commentaire : ${state.commentaire || "-"}`);
  lines.push("");
  lines.push("Merci !");
  return lines.join("\n");
}

function stateToCartLine(state) {
  const subArticles = computeSubtotalArticles(state);
  if (subArticles == null) return null;
  return {
    product: state.product,
    format: state.format,
    phrase: state.phrase,
    fourrure: state.fourrure,
    bicolore: state.bicolore,
    bicoloreDetail: state.bicoloreDetail,
    prenomAddon: state.prenomAddon,
    prenom: state.prenom,
    photoLink: state.photoLink,
    commentaire: state.commentaire,
    quantity: state.quantity,
    subtotal: subArticles,
  };
}

function lineLabel(line) {
  const product = PRODUCT_LABELS[line.product] || line.product;
  if (line.format && FORMAT_LABELS[line.format]) {
    return `${line.quantity} × ${product} — ${FORMAT_LABELS[line.format]}`;
  }
  return `${line.quantity} × ${product}`;
}

function lineDetail(line) {
  const details = [];
  if (line.product === "abo3Mois" || line.product === "aboAnnee") {
    details.push("Paiement one shot");
  }
  if (line.color) details.push(`Couleur: ${line.color}`);
  if (line.product === "petit" || line.product === "grand") {
    if (line.phrase) details.push(`Phrase: ${line.phrase}`);
  }
  if (line.product === "chat") {
    const fur = FOURRURE_LABELS[line.fourrure] || line.fourrure;
    if (fur) details.push(`Fourrure: ${fur}`);
    if (line.bicolore && line.bicoloreDetail) details.push(`Bicolore: ${line.bicoloreDetail}`);
    if (line.prenomAddon && line.prenom) details.push(`Prenom: ${line.prenom}`);
  }
  if (line.commentaire) details.push(`Note: ${line.commentaire}`);
  return details.join(" · ");
}

function setupBoxAddToCartButtons() {
  document.querySelectorAll("[data-add-box]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-add-box");
      const price = BOX_ONE_SHOT_EUR[key];
      if (!price) return;
      CartStore.add({
        product: key,
        quantity: 1,
        subtotal: price,
      });
      renderOrderCart();
      showToast("Box ajoutée au panier.");
    });
  });
}

function setupAccessoryAddToCartButtons() {
  document.querySelectorAll("[data-add-accessory-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-add-accessory-card");
      const accessory = ACCESSORY_PRODUCTS[key];
      if (!accessory) return;

      const card = btn.closest(".card");
      const color = card?.querySelector(`input[name="accessory-color-${key}"]:checked`)?.value || "Noir";
      const qtyRaw = card?.querySelector(".accessory-qty")?.value || "1";
      const quantity = Math.max(1, Number.parseInt(qtyRaw, 10) || 1);

      CartStore.add({
        product: key,
        quantity,
        color,
        subtotal: Math.round(accessory.price * quantity * 100) / 100,
      });
      renderOrderCart();
      showToast("Accessoire ajouté au panier.");
    });
  });

  document.querySelectorAll(".qty-step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number.parseInt(btn.getAttribute("data-qty-step") || "0", 10);
      const input = btn.closest(".qty-stepper")?.querySelector(".accessory-qty");
      if (!input) return;
      const current = Math.max(1, Number.parseInt(input.value || "1", 10) || 1);
      const next = Math.max(1, current + delta);
      input.value = String(next);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

function computeCartTotal() {
  const subtotal = orderCart.reduce((sum, line) => sum + Math.round(Number(line.subtotal || 0) * 100), 0) / 100;
  if (!orderCart.length) return null;
  return Math.round((subtotal + SHIPPING_EUR) * 100) / 100;
}

function computeCartSubtotal() {
  return orderCart.reduce((sum, line) => sum + Math.round(Number(line.subtotal || 0) * 100), 0) / 100;
}

function updateCartCountBadges() {
  const count = orderCart.length;
  const badge = document.getElementById("header-cart-count");
  if (badge) badge.textContent = String(count);
}

function renderOrderCart() {
  const list = document.getElementById("order-cart-list");
  const totalEl = document.getElementById("order-cart-total");
  const subtotalEl = document.getElementById("order-cart-subtotal");
  if (!list || !totalEl) return;
  if (!orderCart.length) {
    list.innerHTML = "<p class='muted'>Votre panier est vide.</p>";
    totalEl.textContent = "0,00 €";
    if (subtotalEl) subtotalEl.textContent = "0,00 €";
    updateCartCountBadges();
    toggleCartActionButtons();
    return;
  }

  list.innerHTML = orderCart
    .map(
      (line, idx) => `
      <article class="order-cart-item">
        <div class="order-cart-item-head">
          <strong>${lineLabel(line)}</strong>
          <button type="button" class="cart-remove-btn" data-cart-remove="${idx}">Supprimer</button>
        </div>
        <p class="muted">${lineDetail(line) || "Sans option"}</p>
        <p class="muted">${formatEuro(line.subtotal || 0)}</p>
      </article>
    `
    )
    .join("");

  const subtotal = computeCartSubtotal();
  if (subtotalEl) subtotalEl.textContent = formatEuro(subtotal);
  totalEl.textContent = formatEuro(computeCartTotal());
  updateCartCountBadges();
  toggleCartActionButtons();

  list.querySelectorAll("[data-cart-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-cart-remove"));
      CartStore.removeAt(index);
      renderOrderCart();
      schedulePayPalRender();
    });
  });
}

function buildPayPalDescription(state) {
  const p = PRODUCT_LABELS[state.product] || state.product;
  const f = FORMAT_LABELS[state.format] || state.format;
  let s = `LPS — ${p} — ${f}`;
  if ((state.product === "petit" || state.product === "grand") && state.phrase) {
    s += ` — ${state.phrase}`;
  }
  return s.slice(0, 120);
}

/** Détail visible sur la facture PayPal (ligne article, tronquée). */
function buildPayPalItemDetail(state) {
  const parts = [];
  if (state.product === "petit" || state.product === "grand") {
    if (state.phrase) parts.push(`Phrase : ${state.phrase}`);
  }
  if (state.product === "chat") {
    const fur = FOURRURE_LABELS[state.fourrure] || state.fourrure;
    if (fur) parts.push(`Fourrure : ${fur}`);
    if (state.bicolore && state.bicoloreDetail) parts.push(`Bicolore : ${state.bicoloreDetail}`);
    if (state.prenomAddon && state.prenom) parts.push(`Prénom : ${state.prenom}`);
    if (state.photoLink) parts.push(`Photo : ${state.photoLink}`);
  }
  if (state.commentaire) parts.push(`Note : ${state.commentaire}`);
  let s = parts.join(" · ");
  if (s.length > 127) s = `${s.slice(0, 124)}…`;
  return s;
}

function buildPayPalCustomId(state) {
  const payload = {
    p: state.product,
    f: state.format,
    bi: state.bicolore ? 1 : 0,
    pr: state.prenomAddon ? 1 : 0,
  };
  try {
    return JSON.stringify(payload).slice(0, 127);
  } catch {
    return "lps-order";
  }
}

function destroyOrderPaypalButtons() {
  const wrap = document.getElementById("order-paypal-wrap");
  const container = document.getElementById("order-paypal-container");
  if (container) container.innerHTML = "";
  if (orderPaypalButtons && typeof orderPaypalButtons.close === "function") {
    try {
      orderPaypalButtons.close();
    } catch {
      /* ignore */
    }
  }
  orderPaypalButtons = null;
  if (wrap) wrap.hidden = true;
}

async function schedulePayPalRender() {
  clearTimeout(orderPaypalRenderTimer);
  orderPaypalRenderTimer = setTimeout(() => renderOrderPayPalIfPossible(), 280);
}

async function renderOrderPayPalIfPossible() {
  destroyOrderPaypalButtons();
  const state = getOrderState();
  const singleTotal = computeTotalEur(state);
  const ok = validateOrder(state);
  const hasCart = orderCart.length > 0;
  const total = hasCart ? computeCartTotal() : singleTotal;
  const hint = document.getElementById("order-paypal-hint");
  const wrap = document.getElementById("order-paypal-wrap");

  if (!PAYPAL_CLIENT_ID) {
    if (hint) {
      hint.textContent =
        "Pour payer directement ici, ajoutez votre Client ID PayPal dans script.js (voir commentaire en tête du fichier).";
    }
    return;
  }

  if ((!ok && !hasCart) || total == null) {
    if (hint) hint.textContent = "";
    return;
  }

  if (hint) hint.textContent = "";

  try {
    const paypal = await loadPayPalSdk(PAYPAL_CLIENT_ID);
    if (wrap) wrap.hidden = false;
    const lines = hasCart ? orderCart : [stateToCartLine(state)].filter(Boolean);
    const subArticles = lines.reduce((sum, line) => sum + Math.round(Number(line.subtotal || 0) * 100), 0) / 100;
    const shipStr = SHIPPING_EUR.toFixed(2);
    const subStr = subArticles.toFixed(2);
    const nameLine = hasCart ? "LPS — Panier multi-produits" : buildPayPalDescription(state);
    const detailLine = hasCart ? `${lines.length} article(s)` : buildPayPalItemDetail(state);
    const paypalItems = lines.map((line) => ({
      name: lineLabel(line).slice(0, 127),
      description: lineDetail(line).slice(0, 127),
      quantity: "1",
      unit_amount: { currency_code: "EUR", value: Number(line.subtotal || 0).toFixed(2) },
    }));

    orderPaypalButtons = paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "pay" },
      createOrder: (_data, actions) =>
        {
          const shippingState = getShippingState();
          if (!validateShippingState(shippingState)) {
            showToast("Merci de compléter vos coordonnées de livraison avant paiement.");
            throw new Error("Shipping fields missing");
          }
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: "EUR",
                  value: total.toFixed(2),
                  breakdown: {
                    item_total: { currency_code: "EUR", value: subStr },
                    shipping: { currency_code: "EUR", value: shipStr },
                  },
                },
                items: [
                  ...paypalItems,
                ],
                description: nameLine.slice(0, 127),
                custom_id: hasCart ? `lps-cart-${Date.now()}` : buildPayPalCustomId(state),
              },
            ],
          });
        },
      onApprove: async (_data, actions) => {
        const capture = await actions.order.capture();
        const shippingState = getShippingState();
        await persistOrderToSupabase(capture, lines, total, shippingState);
        showToast("Paiement reçu, merci ! Je prépare votre commande.");
        CartStore.clear();
        renderOrderCart();
        if (hint) hint.textContent = "Paiement confirmé. Merci !";
        const checkoutModal = document.getElementById("checkout-modal");
        const drawer = document.getElementById("cart-drawer");
        const drawerBackdrop = document.getElementById("cart-drawer-backdrop");
        closeCheckoutModal(checkoutModal);
        closeCartDrawer(drawer, drawerBackdrop);
        closeOrderModal();
      },
      onCancel: () => {
        const msg = "Paiement annulé. Vous pouvez réessayer quand vous voulez.";
        if (hint) hint.textContent = msg;
        showToast(msg);
      },
      onError: (err) => {
        const msg =
          typeof err === "string"
            ? err
            : "Une erreur PayPal est survenue. Réessayez ou utilisez le lien email en dessous.";
        if (hint) hint.textContent = msg;
        showToast(msg);
      },
    });
    await orderPaypalButtons.render("#order-paypal-container");
  } catch {
    if (wrap) wrap.hidden = true;
    const msg = "PayPal ne s'est pas chargé. Vérifiez la connexion ou utilisez le lien email ci-dessous.";
    if (hint) hint.textContent = msg;
    showToast(msg);
  }
}

function updateOrderSummary() {
  populatePhraseSelect();
  const state = getOrderState();
  syncOrderModalLayout();
  const liveTotalEl = document.getElementById("order-live-total");
  const subtotal = computeSubtotalArticles(state);
  if (liveTotalEl) {
    if (subtotal == null) {
      liveTotalEl.textContent = "—";
    } else {
      const baseUnit = PRODUCT_BASE_EUR[state.product]?.[state.format] || 0;
      const baseTotal = Math.round(baseUnit * state.quantity * 100) / 100;
      if (state.product !== "chat") {
        const formatLabel = state.format === "kit" ? "kit" : "broderie entière";
        liveTotalEl.textContent = `${formatEuro(subtotal)} — ${formatLabel}`;
      } else {
        const detailParts = [`broderie entière ${formatEuro(baseTotal)}`];
        if (state.bicolore) {
          const bicoloreUnit = state.format === "fini" ? OPTION_FEES.bicoloreFini : OPTION_FEES.bicoloreKit;
          detailParts.push(`bicolore ${formatEuro(bicoloreUnit * state.quantity)}`);
        }
        if (state.prenomAddon) {
          const prenomUnit = state.format === "fini" ? OPTION_FEES.prenomFini : OPTION_FEES.prenomKit;
          detailParts.push(`prénom ${formatEuro(prenomUnit * state.quantity)}`);
        }
        if (state.format === "kit") {
          detailParts[0] = `kit ${formatEuro(baseTotal)}`;
        }
        liveTotalEl.textContent = `${formatEuro(subtotal)} (${detailParts.join(" + ")})`;
      }
    }
  }
  schedulePayPalRender();
}

function toggleCartActionButtons() {
  const continueBtn = document.getElementById("order-continue-btn");
  const viewCartBtn = document.getElementById("order-go-checkout-btn");
  const hasCart = CartStore.hasItems();
  if (continueBtn) continueBtn.hidden = !hasCart;
  if (viewCartBtn) viewCartBtn.hidden = !hasCart;
}

function syncOrderFormatPills(formatValue) {
  document.querySelectorAll('input[name="order-format-pill"]').forEach((radio) => {
    radio.checked = radio.value === formatValue;
  });
}

function openOrderModal(presetProduct, presetFormat) {
  const modal = document.getElementById("order-modal");
  if (!modal) return;

  const productEl = document.getElementById("order-product");
  const formatEl = document.getElementById("order-format");
  const rowProduct = document.getElementById("order-row-product");

  if (productEl) productEl.value = presetProduct || "";
  if (formatEl) formatEl.value = presetFormat || "";
  syncOrderFormatPills(formatEl?.value || "");

  if (rowProduct) {
    const locked = Boolean(presetProduct);
    rowProduct.style.display = locked ? "none" : "";
    if (productEl) productEl.disabled = locked;
  }

  [
    "order-phrase",
    "order-fourrure",
    "order-bicolore-detail",
    "order-prenom",
    "order-photo-link",
    "order-commentaire",
    "order-qty",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
  });

  const fur = document.getElementById("order-fourrure");
  if (fur) fur.value = "";
  const qty = document.getElementById("order-qty");
  if (qty) qty.value = "1";
  document.getElementById("order-prenom-addon-no")?.click();

  setModalState(modal, true);
  document.body.style.overflow = "hidden";

  updateOrderSummary();

  const focusTarget = presetProduct ? formatEl || productEl : productEl;
  window.setTimeout(() => focusTarget?.focus(), 50);
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (!modal) return;
  setModalState(modal, false);
  document.body.style.overflow = "";
  destroyOrderPaypalButtons();

  const productEl = document.getElementById("order-product");
  const rowProduct = document.getElementById("order-row-product");
  if (productEl) productEl.disabled = false;
  if (rowProduct) rowProduct.style.display = "";
}

function bindOrderInputsForSummary() {
  [
    "order-product",
    "order-format",
    "order-phrase",
    "order-fourrure",
    "order-bicolore-detail",
    "order-prenom",
    "order-photo-link",
    "order-commentaire",
    "order-qty",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateOrderSummary);
    document.getElementById(id)?.addEventListener("change", updateOrderSummary);
  });

  document.querySelectorAll('input[name="order-prenom-addon"]').forEach((el) => {
    el.addEventListener("change", updateOrderSummary);
  });

  const formatSelect = document.getElementById("order-format");
  if (formatSelect) {
    formatSelect.addEventListener("change", () => {
      syncOrderFormatPills(formatSelect.value);
    });
  }

  document.querySelectorAll('input[name="order-format-pill"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      if (formatSelect) {
        formatSelect.value = radio.value;
        formatSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      updateOrderSummary();
    });
  });
}

function buildCartMailBody(total) {
  return [
    "Bonjour,",
    "",
    "Récapitulatif panier :",
    "",
    ...orderCart.flatMap((line) => [
      `${lineLabel(line)} — ${Number(line.subtotal || 0).toFixed(2)} €`,
      lineDetail(line) || "Sans option",
      "",
    ]),
    `Livraison : ${SHIPPING_EUR.toFixed(2)} €`,
    `Total : ${total != null ? `${total.toFixed(2)} €` : "(à confirmer)"}`,
    "",
    "Merci !",
  ].join("\n");
}

function openCartDrawer(drawer, drawerBackdrop) {
  if (!drawer || !drawerBackdrop) return;
  setModalState(drawer, true);
  setModalState(drawerBackdrop, true);
}

function closeCartDrawer(drawer, drawerBackdrop) {
  if (!drawer || !drawerBackdrop) return;
  setModalState(drawer, false);
  setModalState(drawerBackdrop, false);
}

function openCheckoutModal(checkoutModal) {
  if (!checkoutModal) return;
  setModalState(checkoutModal, true);
  document.body.style.overflow = "hidden";
  schedulePayPalRender();
  const wrap = document.getElementById("order-paypal-wrap");
  if (wrap) wrap.hidden = false;
}

function closeCheckoutModal(checkoutModal) {
  if (!checkoutModal) return;
  setModalState(checkoutModal, false);
  document.body.style.overflow = "";
}

function setupOrderModal() {
  const modal = document.getElementById("order-modal");
  const closeBtn = document.getElementById("close-order-modal");
  const mailBtn = document.getElementById("order-mailto-btn");
  const addCartBtn = document.getElementById("order-add-cart-btn");
  const clearCartBtn = document.getElementById("order-cart-clear-btn");
  const continueBtn = document.getElementById("order-continue-btn");
  const goCheckoutBtn = document.getElementById("order-go-checkout-btn");
  const drawerCheckoutBtn = document.getElementById("drawer-checkout-btn");
  const openDrawerBtn = document.getElementById("open-cart-drawer");
  const closeDrawerBtn = document.getElementById("close-cart-drawer");
  const drawer = document.getElementById("cart-drawer");
  const drawerBackdrop = document.getElementById("cart-drawer-backdrop");
  const checkoutModal = document.getElementById("checkout-modal");
  const closeCheckoutBtn = document.getElementById("close-checkout-modal");

  document.querySelectorAll("[data-open-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-open-order");
      const presetProduct = raw && raw.length ? raw : "";
      const presetFormat = btn.getAttribute("data-order-format") || "";
      openOrderModal(presetProduct, presetFormat);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeOrderModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeOrderModal();
    });
  }
  bindOrderInputsForSummary();

  if (mailBtn) {
    mailBtn.addEventListener("click", () => {
      const hasCart = orderCart.length > 0;
      const state = getOrderState();
      const total = hasCart ? computeCartTotal() : computeTotalEur(state);
      if (!hasCart && !validateOrder(state)) {
        showToast("Merci de compléter les champs obligatoires 🙏");
        return;
      }
      const bodyText = hasCart ? buildCartMailBody(total) : buildMailtoBody(state, total);
      const subject = encodeURIComponent("Commande Les Points Sauvages");
      const body = encodeURIComponent(bodyText);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });
  }

  if (addCartBtn) {
    addCartBtn.addEventListener("click", () => {
      const state = getOrderState();
      if (!validateOrder(state)) {
        showToast("Complétez les champs obligatoires avant d'ajouter au panier.");
        return;
      }
      const line = stateToCartLine(state);
      if (!line) {
        showToast("Impossible d'ajouter cette ligne.");
        return;
      }
      CartStore.add(line);
      renderOrderCart();
      schedulePayPalRender();
      showToast("Article ajouté au panier.");
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      closeOrderModal();
    });
  }

  if (goCheckoutBtn) {
    goCheckoutBtn.addEventListener("click", () => {
      closeOrderModal();
      openCartDrawer(drawer, drawerBackdrop);
    });
  }

  if (drawerCheckoutBtn) {
    drawerCheckoutBtn.addEventListener("click", () => {
      closeCartDrawer(drawer, drawerBackdrop);
      openCheckoutModal(checkoutModal);
    });
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener("click", () => openCartDrawer(drawer, drawerBackdrop));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => closeCartDrawer(drawer, drawerBackdrop));
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", () => closeCartDrawer(drawer, drawerBackdrop));
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", () => closeCheckoutModal(checkoutModal));
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) closeCheckoutModal(checkoutModal);
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      CartStore.clear();
      renderOrderCart();
      schedulePayPalRender();
    });
  }

  toggleCartActionButtons();
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const message = document.getElementById("contact-message")?.value.trim() || "";
    const name = document.getElementById("contact-name")?.value.trim() || "";
    if (!email || !message) {
      showToast("Merci de remplir email et message.");
      return;
    }
    const result = await insertSupabase("contact_requests", {
      name: name || null,
      email,
      message,
    });
    if (result.ok) {
      form.reset();
      showToast("Message envoyé. Merci !");
      return;
    }
    if (result.missingConfig) {
      const subject = encodeURIComponent("Contact Les Points Sauvages");
      const body = encodeURIComponent(`${name ? `Prénom: ${name}\n` : ""}${message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    showToast("Impossible d'envoyer pour le moment, réessayez.");
  });
}

function setupSubscriptionRequests() {
  const modal = document.getElementById("subscription-modal");
  const closeBtn = document.getElementById("close-subscription-modal");
  const form = document.getElementById("subscription-form");
  const typeEl = document.getElementById("subscription-type");
  document.querySelectorAll("[data-open-subscription-request]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-open-subscription-request") || "gift";
      if (typeEl) typeEl.value = type;
      setModalState(modal, true);
      document.body.style.overflow = "hidden";
    });
  });
  closeBtn?.addEventListener("click", () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
  });
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      setModalState(modal, false);
      document.body.style.overflow = "";
    }
  });
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const type = document.getElementById("subscription-type")?.value || "gift";
    const email = document.getElementById("subscription-email")?.value.trim() || "";
    const message = document.getElementById("subscription-message")?.value.trim() || "";
    if (!email || !message) {
      showToast("Merci de compléter les champs obligatoires.");
      return;
    }
    const result = await insertSupabase("subscription_requests", { type, email, message });
    if (result.ok) {
      form.reset();
      setModalState(modal, false);
      document.body.style.overflow = "";
      showToast("Demande envoyée. Je reviens vers vous rapidement.");
      return;
    }
    if (result.missingConfig) {
      const subject = encodeURIComponent("Demande abonnement Les Points Sauvages");
      const body = encodeURIComponent(`Type: ${type}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    showToast("Impossible d'envoyer pour le moment.");
  });
}

/* ── Contact email link ─────────────────────── */

function updateContactLinks() {
  const emailLinks = document.querySelectorAll("#contact-email-link, [data-email]");
  emailLinks.forEach((link) => {
    link.setAttribute("href", `mailto:${CONTACT_EMAIL}`);
    if (!link.textContent.trim() || link.textContent.includes("contact@lespointssauvages")) {
      link.textContent = CONTACT_EMAIL;
    }
  });
}

/* ── Scroll reveal ──────────────────────────── */

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
}

/* ── Toast helper ───────────────────────────── */

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ── Footer year ────────────────────────────── */

function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ── Legal modal ─────────────────────────────── */

function setupLegalModal() {
  const modal = document.getElementById("legal-modal");
  const openBtn = document.getElementById("open-legal-modal");
  const closeBtn = document.getElementById("close-legal-modal");
  if (!modal || !openBtn || !closeBtn) return;

  const openModal = () => {
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  const closeModal = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
    openBtn.focus();
  };

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  const toPrivacy = document.getElementById("legal-to-privacy");
  const privacyModal = document.getElementById("privacy-modal");
  const closePrivacy = document.getElementById("close-privacy-modal");

  const openPrivacyModal = () => {
    closeModal();
    if (!privacyModal || !closePrivacy) return;
    setModalState(privacyModal, true);
    document.body.style.overflow = "hidden";
    closePrivacy.focus();
  };

  toPrivacy?.addEventListener("click", openPrivacyModal);
}

/* ── Privacy modal ───────────────────────────── */

function setupPrivacyModal() {
  const modal = document.getElementById("privacy-modal");
  const openBtn = document.getElementById("open-privacy-modal");
  const closeBtn = document.getElementById("close-privacy-modal");
  if (!modal || !openBtn || !closeBtn) return;

  const closeModal = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
    openBtn.focus();
  };

  openBtn.addEventListener("click", () => {
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  });
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

/* ── Escape : priorité à la modale commande ─── */

function setupGlobalEscape() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const checkout = document.getElementById("checkout-modal");
    if (checkout?.classList.contains("is-open")) {
      setModalState(checkout, false);
      document.body.style.overflow = "";
      event.preventDefault();
      return;
    }
    const drawer = document.getElementById("cart-drawer");
    const drawerBackdrop = document.getElementById("cart-drawer-backdrop");
    if (drawer?.classList.contains("is-open")) {
      setModalState(drawer, false);
      setModalState(drawerBackdrop, false);
      event.preventDefault();
      return;
    }
    const order = document.getElementById("order-modal");
    if (order?.classList.contains("is-open")) {
      closeOrderModal();
      event.preventDefault();
      return;
    }
    const privacy = document.getElementById("privacy-modal");
    if (privacy?.classList.contains("is-open")) {
      setModalState(privacy, false);
      document.body.style.overflow = "";
      document.getElementById("open-privacy-modal")?.focus();
      event.preventDefault();
      return;
    }
    const legal = document.getElementById("legal-modal");
    if (legal?.classList.contains("is-open")) {
      setModalState(legal, false);
      document.body.style.overflow = "";
      document.getElementById("open-legal-modal")?.focus();
      event.preventDefault();
      return;
    }
    const subscription = document.getElementById("subscription-modal");
    if (subscription?.classList.contains("is-open")) {
      setModalState(subscription, false);
      document.body.style.overflow = "";
      event.preventDefault();
    }
  });
}

/* ── Init ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  orderCart = CartStore.load();
  wirePayPalBoxButtons();
  setupBoxAddToCartButtons();
  setupAccessoryAddToCartButtons();
  setupOrderModal();
  renderOrderCart();
  updateContactLinks();
  setupReveal();
  setFooterYear();
  setupLegalModal();
  setupPrivacyModal();
  setupGlobalEscape();
  setupContactForm();
  setupSubscriptionRequests();
});
