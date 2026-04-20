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
const SHIPPING_EUR = 4.99;

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

const PRODUCT_LABELS = {
  petit: "Petit mot",
  grand: "Grand mot",
  chat: "Petit chat qui dort",
};

const FORMAT_LABELS = {
  kit: "Kit DIY",
  fini: "Broderie finie",
};

const PHRASES_PETIT = ["Merde", "Putain", "Ba super"];
const PHRASES_GRAND = ["Sauf erreur de ma part", "Pas là pour plaire"];

const FOURRURE_LABELS = {
  noir: "Noir",
  blanc: "Blanc",
  roux: "Roux / ginger",
  gris: "Gris",
  bleu_gris: "Bleu-gris",
  bicolore: "Bicolore (supplément)",
};

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
  };
}

function computeSubtotalArticles(state) {
  const base = PRODUCT_BASE_EUR[state.product]?.[state.format];
  if (base == null) return null;
  let total = base;
  if (state.product === "chat") {
    if (state.bicolore) {
      total += state.format === "fini" ? OPTION_FEES.bicoloreFini : OPTION_FEES.bicoloreKit;
    }
    if (state.prenomAddon) {
      total += state.format === "fini" ? OPTION_FEES.prenomFini : OPTION_FEES.prenomKit;
    }
  }
  return Math.round(total * 100) / 100;
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
  const total = computeTotalEur(state);
  const ok = validateOrder(state);
  const hint = document.getElementById("order-paypal-hint");
  const wrap = document.getElementById("order-paypal-wrap");

  if (!PAYPAL_CLIENT_ID) {
    if (hint) {
      hint.textContent =
        "Pour payer directement ici, ajoutez votre Client ID PayPal dans script.js (voir commentaire en tête du fichier).";
    }
    return;
  }

  if (!ok || total == null) {
    if (hint) hint.textContent = "";
    return;
  }

  if (hint) hint.textContent = "";

  try {
    const paypal = await loadPayPalSdk(PAYPAL_CLIENT_ID);
    if (wrap) wrap.hidden = false;
    const subArticles = computeSubtotalArticles(state);
    const shipStr = SHIPPING_EUR.toFixed(2);
    const subStr = subArticles != null ? subArticles.toFixed(2) : total.toFixed(2);
    const nameLine = buildPayPalDescription(state);
    const detailLine = buildPayPalItemDetail(state);

    orderPaypalButtons = paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "pay" },
      createOrder: (_data, actions) =>
        actions.order.create({
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
                {
                  name: nameLine.slice(0, 127),
                  description: detailLine.slice(0, 127),
                  quantity: "1",
                  unit_amount: { currency_code: "EUR", value: subStr },
                },
                {
                  name: "Livraison (France)",
                  quantity: "1",
                  unit_amount: { currency_code: "EUR", value: shipStr },
                },
              ],
              description: nameLine.slice(0, 127),
              custom_id: buildPayPalCustomId(state),
            },
          ],
        }),
      onApprove: async (_data, actions) => {
        await actions.order.capture();
        showToast("Paiement reçu, merci ! Je prépare votre commande.");
        closeOrderModal();
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
  const summary = document.getElementById("order-summary");
  if (!summary) return;
  populatePhraseSelect();
  const state = getOrderState();
  syncOrderModalLayout();

  const subArticles = computeSubtotalArticles(state);
  const total = computeTotalEur(state);
  const ok = validateOrder(state);

  if (!state.product || !state.format) {
    summary.innerHTML = "<span class='muted'>Choisissez un produit et un format pour voir le total.</span>";
    schedulePayPalRender();
    return;
  }

  let html = "";
  html += `<strong>${PRODUCT_LABELS[state.product]}</strong> — ${FORMAT_LABELS[state.format]}<br/>`;

  if ((state.product === "petit" || state.product === "grand") && state.phrase) {
    html += `<span class='muted'>Phrase : « ${state.phrase} »</span><br/>`;
  }

  if (state.product === "chat" && subArticles != null) {
    const furLabel = FOURRURE_LABELS[state.fourrure] || state.fourrure;
    if (furLabel) html += `<span class='muted'>Fourrure : ${furLabel}</span><br/>`;
    if (state.bicolore && state.bicoloreDetail) {
      html += `<span class='muted'>Précisions bicolore : ${state.bicoloreDetail}</span><br/>`;
    }
    const baseOnly = PRODUCT_BASE_EUR.chat[state.format];
    html += `<span class='muted'>Base ${baseOnly} €</span>`;
    const extras = [];
    if (state.bicolore) {
      const add = state.format === "fini" ? OPTION_FEES.bicoloreFini : OPTION_FEES.bicoloreKit;
      extras.push(`bicolore +${add} €`);
    }
    if (state.prenomAddon) {
      const add = state.format === "fini" ? OPTION_FEES.prenomFini : OPTION_FEES.prenomKit;
      extras.push(`prénom +${add} €`);
    }
    if (extras.length) html += `<br/><span class='muted'>Options : ${extras.join(", ")}</span>`;
  } else if (subArticles != null) {
    html += `<span class='muted'>Articles ${subArticles.toFixed(2)} €</span>`;
  }

  if (subArticles != null) {
    html += `<br/><span class='muted'>Livraison ${SHIPPING_EUR.toFixed(2)} €</span>`;
  }

  if (total != null) {
    html += `<br/><strong>Total : ${total.toFixed(2)} €</strong>`;
  }

  if (!ok) {
    html += `<br/><span class='muted'>Complétez les champs obligatoires pour payer.</span>`;
  }

  summary.innerHTML = html;
  schedulePayPalRender();
}

function openOrderModal(presetProduct, presetFormat) {
  const modal = document.getElementById("order-modal");
  if (!modal) return;

  const productEl = document.getElementById("order-product");
  const formatEl = document.getElementById("order-format");
  const rowProduct = document.getElementById("order-row-product");

  if (productEl) productEl.value = presetProduct || "";
  if (formatEl) formatEl.value = presetFormat || "";

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
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
  });

  const fur = document.getElementById("order-fourrure");
  if (fur) fur.value = "";
  document.getElementById("order-prenom-addon-no")?.click();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  updateOrderSummary();

  const focusTarget = presetProduct ? formatEl || productEl : productEl;
  window.setTimeout(() => focusTarget?.focus(), 50);
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  destroyOrderPaypalButtons();

  const productEl = document.getElementById("order-product");
  const rowProduct = document.getElementById("order-row-product");
  if (productEl) productEl.disabled = false;
  if (rowProduct) rowProduct.style.display = "";
}

function setupOrderModal() {
  const modal = document.getElementById("order-modal");
  const closeBtn = document.getElementById("close-order-modal");
  const mailBtn = document.getElementById("order-mailto-btn");

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

  [
    "order-product",
    "order-format",
    "order-phrase",
    "order-fourrure",
    "order-bicolore-detail",
    "order-prenom",
    "order-photo-link",
    "order-commentaire",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateOrderSummary);
    document.getElementById(id)?.addEventListener("change", updateOrderSummary);
  });

  document.querySelectorAll('input[name="order-prenom-addon"]').forEach((el) => {
    el.addEventListener("change", updateOrderSummary);
  });

  if (mailBtn) {
    mailBtn.addEventListener("click", () => {
      const state = getOrderState();
      const total = computeTotalEur(state);
      if (!validateOrder(state)) {
        showToast("Merci de compléter les champs obligatoires 🙏");
        return;
      }
      const subject = encodeURIComponent("Commande Les Points Sauvages");
      const body = encodeURIComponent(buildMailtoBody(state, total));
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });
  }
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
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
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
    privacyModal.classList.add("is-open");
    privacyModal.setAttribute("aria-hidden", "false");
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
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    openBtn.focus();
  };

  openBtn.addEventListener("click", () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
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
    const order = document.getElementById("order-modal");
    if (order?.classList.contains("is-open")) {
      closeOrderModal();
      event.preventDefault();
      return;
    }
    const privacy = document.getElementById("privacy-modal");
    if (privacy?.classList.contains("is-open")) {
      privacy.classList.remove("is-open");
      privacy.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.getElementById("open-privacy-modal")?.focus();
      event.preventDefault();
      return;
    }
    const legal = document.getElementById("legal-modal");
    if (legal?.classList.contains("is-open")) {
      legal.classList.remove("is-open");
      legal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.getElementById("open-legal-modal")?.focus();
      event.preventDefault();
    }
  });
}

/* ── Init ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  wirePayPalBoxButtons();
  setupOrderModal();
  updateContactLinks();
  setupReveal();
  setFooterYear();
  setupLegalModal();
  setupPrivacyModal();
  setupGlobalEscape();
});
