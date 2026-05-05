/* ═══════════════════════════════════════════════
   Les Points Rebelles — script.js
   ═══════════════════════════════════════════════ */

/* ── Configuration ──────────────────────────── */

/* Constantes déplacées dans components/config.js */

function formatEuro(amount) {
  return `${Number(amount).toFixed(2).replace(".", ",")} €`;
}

function formatEuroPlain(amount) {
  return Number(amount).toFixed(2).replace(".", ",");
}

function syncDisplayedPrices() {
  const prixPetit = document.getElementById("price-petit");
  const prixGrand = document.getElementById("price-grand");
  const prixChat = document.getElementById("price-chat");
  if (prixPetit) {
    prixPetit.textContent = `À partir de : ${formatEuro(PRODUCT_BASE_EUR.petit.kit)}`;
  }
  if (prixGrand) {
    prixGrand.textContent = `À partir de : ${formatEuro(PRODUCT_BASE_EUR.grand.kit)}`;
  }
  if (prixChat) { 
    prixChat.textContent = `À partir de : ${formatEuro(PRODUCT_BASE_EUR.chat.kit)}`;
  }

  const ear = document.getElementById("accessory-price-oreilles");
  const stand = document.getElementById("accessory-price-stand");
  if (ear && ACCESSORY_PRODUCTS["oreilles-chat"]) {
    ear.textContent = `${formatEuro(ACCESSORY_PRODUCTS["oreilles-chat"].price)} · PLA biosourcé`;
  }
  if (stand && ACCESSORY_PRODUCTS["stand-triangle"]) {
    stand.textContent = `${formatEuro(ACCESSORY_PRODUCTS["stand-triangle"].price)} · PLA biosourcé`;
  }

  const pm = document.getElementById("box-price-monthly");
  if (pm) {
    pm.innerHTML = `${formatEuroPlain(BOX_MONTHLY_EUR)} <sup>€</sup><span class="price-period"> / box</span>`;
  }
  const p3 = document.getElementById("box-price-3mois");
  if (p3) {
    p3.innerHTML = `${formatEuroPlain(BOX_ONE_SHOT_EUR.abo3Mois)} <sup>€</sup>`;
  }

  const unitSpan = document.getElementById("box-subscribe-unit-price");
  if (unitSpan) {
    unitSpan.textContent = formatEuroPlain(BOX_MONTHLY_EUR);
  }
  const onceTotal = document.getElementById("box-once-total-label");
  if (onceTotal) {
    onceTotal.textContent = formatEuroPlain(BOX_ONE_SHOT_EUR.abo3Mois);
  }
}

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!window.supabase?.createClient) return null;
  const existing = window.__LPS_SUPABASE_CLIENT__;
  if (existing) return existing;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__LPS_SUPABASE_CLIENT__ = client;
  return client;
}

async function insertSupabase(table, payload) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, missingConfig: true };
  const { error } = await client.from(table).insert(payload);
  if (error) return { ok: false, error };
  return { ok: true };
}

function getShippingState() {
  const deliveryMethod = getSelectedDeliveryMethod();
  return {
    deliveryMethod,
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

function getSelectedDeliveryMethod() {
  return (
    document.querySelector('input[name="delivery-method-checkout"]:checked')?.value ||
    document.querySelector('input[name="delivery-method"]:checked')?.value ||
    SHIPPING_METHODS.ship
  );
}

function syncDeliveryMethodToggles(method) {
  document.querySelectorAll('input[name="delivery-method"], input[name="delivery-method-checkout"]').forEach((input) => {
    input.checked = input.value === method;
  });
}

function isPickupDelivery(state) {
  return state?.deliveryMethod === SHIPPING_METHODS.pickup;
}

function getShippingFeeFromState(state) {
  const hasOnlyGiftCards = Array.isArray(orderCart) && orderCart.length > 0 && orderCart.every((line) => line?.product === "gift-card");
  const hasOnlySubscriptionBoxes =
    Array.isArray(orderCart) &&
    orderCart.length > 0 &&
    orderCart.every((line) =>
      ["aboMensuel", "abo3Mois", "aboBiMensuel"].includes(line?.product)
    );
  if (hasOnlySubscriptionBoxes) return 0;
  if (hasOnlyGiftCards) return 0;
  return isPickupDelivery(state) ? 0 : SHIPPING_EUR;
}

function validateShippingState(state) {
  if (!state.fullName || !state.email) return false;
  if (isPickupDelivery(state)) return true;
  return Boolean(state.address1 && state.postalCode && state.city);
}

function buildPayPalShippingAddress(state) {
  if (!validateShippingState(state)) return null;
  if (isPickupDelivery(state)) return null;
  return {
    name: {
      full_name: state.fullName,
    },
    address: {
      address_line_1: state.address1,
      address_line_2: state.address2 || undefined,
      admin_area_2: state.city,
      postal_code: state.postalCode,
      country_code: "FR",
    },
  };
}

async function persistOrderToSupabase(capture, lines, total, shipping) {
  const shippingFee = getShippingFeeFromState(shipping);
  const pickup = isPickupDelivery(shipping);
  const payload = {
    paypal_order_id: capture?.id || null,
    paypal_status: capture?.status || null,
    payer_email: capture?.payer?.email_address || shipping.email || null,
    payer_name: capture?.payer?.name
      ? `${capture.payer.name.given_name || ""} ${capture.payer.name.surname || ""}`.trim()
      : shipping.fullName || null,
    amount_total: total,
    shipping_fee: shippingFee,
    shipping_full_name: shipping.fullName,
    shipping_email: shipping.email,
    shipping_phone: shipping.phone || null,
    shipping_address_1: pickup ? PICKUP_LABEL : shipping.address1,
    shipping_address_2: pickup ? null : shipping.address2 || null,
    shipping_postal_code: pickup ? "RETRAIT" : shipping.postalCode,
    shipping_city: pickup ? PICKUP_CITY : shipping.city,
    shipping_notes: pickup
      ? [shipping.notes, "Mode de remise: retrait atelier"]
          .filter(Boolean)
          .join(" · ")
      : shipping.notes || null,
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

/* Fonctions commande/panier deplacees dans components/order-flow.js */

function setupBoxModal() {
  const modal = document.getElementById("box-modal");
  const closeBtn = document.getElementById("close-box-modal");
  const form = document.getElementById("box-form");
  const paypalStep = document.getElementById("box-paypal-step");
  const paypalStepRecap = document.getElementById("box-paypal-step-recap");
  const paypalContinueBtn = document.getElementById("box-paypal-continue-btn");
  const paypalBackBtn = document.getElementById("box-paypal-back-btn");
  const planEl = document.getElementById("box-plan");
  const subscribePanel = document.getElementById("box-subscribe-panel");
  const onceSummary = document.getElementById("box-once-summary");
  const buyerEmailEl = document.getElementById("box-buyer-email");
  const messageEl = document.getElementById("box-message");
  const recipientNameRow = document.getElementById("box-row-recipient-name");
  const recipientEmailRow = document.getElementById("box-row-recipient-email");
  const recipientNameEl = document.getElementById("box-recipient-name");
  const recipientEmailEl = document.getElementById("box-recipient-email");
  const promoCodeEl = document.getElementById("box-promo-code");
  const promoApplyBtn = document.getElementById("box-promo-apply-btn");
  const promoClearBtn = document.getElementById("box-promo-clear-btn");
  const promoFeedbackEl = document.getElementById("box-promo-feedback");
  const shippingFullNameEl = document.getElementById("box-shipping-fullname");
  const shippingAddressEl = document.getElementById("box-shipping-address1");
  const shippingPostalEl = document.getElementById("box-shipping-postal");
  const shippingCityEl = document.getElementById("box-shipping-city");
  if (!modal || !form || !planEl || !buyerEmailEl) return;
  let pendingMonthlyPayPalUrl = "";
  let boxPromoState = { code: "", add1Month: false };

  function syncPlanFromCadence() {
    const cadence = document.querySelector('input[name="box-cadence"]:checked')?.value || "monthly";
    planEl.value = cadence === "bimonthly" ? "aboBiMensuel" : "aboMensuel";
  }

  function resetBoxSteps() {
    pendingMonthlyPayPalUrl = "";
    form.hidden = false;
    if (paypalStep) paypalStep.hidden = true;
    if (paypalStepRecap) paypalStepRecap.textContent = "";
  }

  function setBoxPromoFeedback(message, isError = false) {
    if (!promoFeedbackEl) return;
    promoFeedbackEl.textContent = message || "";
    promoFeedbackEl.style.color = isError ? "#a2362b" : "";
  }

  async function applyBoxPromoFromInput() {
    const plan = planEl.value;
    const promoCodeRaw = promoCodeEl?.value.trim() || "";
    if (!promoCodeRaw) {
      setBoxPromoFeedback("Entre un code promo.", true);
      return { ok: false, reason: "empty_code" };
    }
    if (typeof window.applyPromoCode !== "function") {
      setBoxPromoFeedback("Promo indisponible pour le moment.", true);
      return { ok: false, reason: "missing_fn" };
    }
    const promoRes = await window.applyPromoCode(promoCodeRaw);
    if (!promoRes?.ok) {
      setBoxPromoFeedback("Code promo invalide ou expiré.", true);
      return { ok: false, reason: promoRes?.reason || "invalid_code" };
    }
    if (plan !== "abo3Mois" && promoRes.add1Month) {
      setBoxPromoFeedback("Ce code est valable uniquement sur les box 3 mois.", true);
      return { ok: false, reason: "plan_not_eligible" };
    }
    boxPromoState = { code: promoRes.code, add1Month: Boolean(promoRes.add1Month) };
    if (promoCodeEl) promoCodeEl.value = promoRes.code;
    if (boxPromoState.add1Month) {
      setBoxPromoFeedback("Code promo enregistré, un mois de plus pour vous et votre parrain !");
    } else {
      setBoxPromoFeedback(`Code ${promoRes.code} appliqué ✅`);
    }
    return { ok: true, ...boxPromoState };
  }

  function syncIntentFields() {
    const intent = document.querySelector('input[name="box-intent"]:checked')?.value || "self";
    const isGift = intent === "gift";
    if (recipientNameRow) recipientNameRow.hidden = !isGift;
    if (recipientEmailRow) recipientEmailRow.hidden = !isGift;
    if (!isGift) {
      if (recipientNameEl) recipientNameEl.value = "";
      if (recipientEmailEl) recipientEmailEl.value = "";
    }
  }

  function openBoxModal(flow) {
    const selfRadio = document.getElementById("box-intent-self");
    const giftRadio = document.getElementById("box-intent-gift");
    const monthlyCadence = document.getElementById("box-cadence-monthly");

    if (flow === "once") {
      if (subscribePanel) subscribePanel.hidden = true;
      if (onceSummary) onceSummary.hidden = false;
      planEl.value = "abo3Mois";
      if (giftRadio) giftRadio.checked = true;
    } else {
      if (subscribePanel) subscribePanel.hidden = false;
      if (onceSummary) onceSummary.hidden = true;
      if (monthlyCadence) monthlyCadence.checked = true;
      syncPlanFromCadence();
      if (selfRadio) selfRadio.checked = true;
    }

    if (buyerEmailEl) buyerEmailEl.value = "";
    if (shippingFullNameEl) shippingFullNameEl.value = "";
    if (shippingAddressEl) shippingAddressEl.value = "";
    if (shippingPostalEl) shippingPostalEl.value = "";
    if (shippingCityEl) shippingCityEl.value = "";
    if (messageEl) messageEl.value = "";
    if (promoCodeEl) promoCodeEl.value = "";
    boxPromoState = { code: "", add1Month: false };
    setBoxPromoFeedback("");
    syncIntentFields();
    resetBoxSteps();
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
  }

  function closeBoxModal() {
    resetBoxSteps();
    setModalState(modal, false);
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-box-flow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flow = btn.getAttribute("data-box-flow") || "subscribe";
      openBoxModal(flow);
    });
  });
  document.querySelectorAll('input[name="box-cadence"]').forEach((radio) => {
    radio.addEventListener("change", syncPlanFromCadence);
  });
  document.querySelectorAll('input[name="box-intent"]').forEach((radio) => {
    radio.addEventListener("change", syncIntentFields);
  });
  closeBtn?.addEventListener("click", closeBoxModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeBoxModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const plan = planEl.value;
    const intent = document.querySelector('input[name="box-intent"]:checked')?.value || "self";
    const buyerEmail = buyerEmailEl.value.trim();
    const recipientName = recipientNameEl?.value.trim() || "";
    const recipientEmail = recipientEmailEl?.value.trim() || "";
    const message = messageEl?.value.trim() || "";
    const shipping = getBoxShippingState();

    if (!buyerEmail) {
      showToast("Merci de renseigner votre email.");
      return;
    }
    if (!validateBoxShippingState(shipping)) {
      showToast("Merci de compléter les coordonnées de livraison.");
      return;
    }
    if (intent === "gift" && !recipientName) {
      showToast("Merci de renseigner le nom du destinataire.");
      return;
    }
    const promoCodeRaw = promoCodeEl?.value.trim() || "";
    if (promoCodeRaw) {
      const promoCheck = await applyBoxPromoFromInput();
      if (!promoCheck.ok) {
        showToast("Code promo invalide ou non éligible.");
        return;
      }
    }

    if (plan === "aboMensuel" || plan === "aboBiMensuel") {
      const entry = PAYPAL_BOX_LINKS[plan];
      if (entry?.url && entry.url !== "#") {
        pendingMonthlyPayPalUrl = entry.url;
        const destination = [shipping.postalCode, shipping.city].filter(Boolean).join(" ");
        if (paypalStepRecap) {
          paypalStepRecap.textContent = `Email: ${buyerEmail} · Livraison: ${shipping.fullName}, ${destination || shipping.address1}`;
        }
        const intro = document.getElementById("box-paypal-step-intro");
        if (intro) {
          intro.textContent =
            plan === "aboBiMensuel"
              ? "Direction PayPal pour valider l’abonnement — une box tous les deux mois, même prix à chaque envoi."
              : "Direction PayPal pour valider l’abonnement — une box chaque mois.";
        }
        form.hidden = true;
        if (paypalStep) paypalStep.hidden = false;
        showToast("Parfait : un coup d’œil au récap, puis ouverture de PayPal.");
      } else {
        showToast(
          plan === "aboBiMensuel"
            ? "Lien PayPal abonnement bi-mensuel à configurer (plan distinct sur PayPal)."
            : "Lien PayPal mensuel à configurer.",
        );
      }
      return;
    }
    const line = buildBoxLineFromPlan(
      plan,
      intent,
      message,
      recipientName,
      recipientEmail,
      shipping,
      boxPromoState.code,
      boxPromoState.add1Month,
    );
    if (!line) {
      showToast("Impossible de préparer cette box.");
      return;
    }
    CartStore.add(line);
    renderOrderCart();
    closeBoxModal();
    showToast(line.add1Month ? "Box ajoutée au panier. +1 mois sera appliqué après paiement." : "Box ajoutée au panier.");
  });

  promoApplyBtn?.addEventListener("click", async () => {
    await applyBoxPromoFromInput();
  });

  promoClearBtn?.addEventListener("click", () => {
    boxPromoState = { code: "", add1Month: false };
    if (promoCodeEl) promoCodeEl.value = "";
    setBoxPromoFeedback("Code promo retiré.");
  });

  paypalContinueBtn?.addEventListener("click", () => {
    if (!pendingMonthlyPayPalUrl) {
      showToast("Lien PayPal indisponible pour le moment.");
      return;
    }
    window.location.href = pendingMonthlyPayPalUrl;
  });

  paypalBackBtn?.addEventListener("click", () => {
    resetBoxSteps();
    showToast("Infos réaffichées. Vous pouvez modifier avant de continuer.");
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

function getGiftCardFormState() {
  return {
    giftRecipientPrenom: document.getElementById("gift-recipient-prenom")?.value.trim() || "",
    giftNote: document.getElementById("gift-note")?.value.trim() || "",
  };
}

function clearGiftCardPresetSelection() {
  document.querySelectorAll(".gift-card-preset").forEach((btn) => {
    btn.classList.remove("is-selected");
    btn.setAttribute("aria-pressed", "false");
  });
}

function resetGiftCardModalFields() {
  const amount = document.getElementById("gift-card-amount");
  if (amount) amount.value = "";
  const p = document.getElementById("gift-recipient-prenom");
  const n = document.getElementById("gift-note");
  if (p) p.value = "";
  if (n) n.value = "";
  clearGiftCardPresetSelection();
}

function closeGiftCardModal() {
  const modal = document.getElementById("gift-card-modal");
  if (!modal) return;
  setModalState(modal, false);
  document.body.style.overflow = "";
  document.getElementById("open-gift-card-modal")?.focus();
}

function submitGiftCardLine() {
  const amountInput = document.getElementById("gift-card-amount");
  const raw = amountInput?.value?.trim() || "";
  const amount = Number.parseFloat(String(raw).replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Indiquez un montant valide (€).");
    return;
  }
  const { giftRecipientPrenom, giftNote } = getGiftCardFormState();
  if (!giftRecipientPrenom) {
    showToast("Indiquez le prénom (pour la personne concernée).");
    return;
  }
  const rounded = Math.round(amount * 100) / 100;
  const line = {
    product: "gift-card",
    quantity: 1,
    subtotal: rounded,
    giftAmount: rounded,
    giftRecipientPrenom,
    ...(giftNote ? { commentaire: giftNote } : {}),
  };
  CartStore.add(line);
  renderOrderCart();
  schedulePayPalRender();
  showToast(`Carte cadeau ${formatEuro(rounded)} ajoutée au panier.`);
  resetGiftCardModalFields();
  closeGiftCardModal();
}

function setupGiftCardButtons() {
  const modal = document.getElementById("gift-card-modal");
  const closeBtn = document.getElementById("close-gift-card-modal");

  const openGiftCardModal = () => {
    if (!modal) return;
    resetGiftCardModalFields();
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
    document.getElementById("gift-card-amount")?.focus();
  };

  document.querySelectorAll(".js-open-gift-card").forEach((el) => {
    el.addEventListener("click", openGiftCardModal);
  });
  closeBtn?.addEventListener("click", closeGiftCardModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeGiftCardModal();
  });

  document.querySelectorAll(".gift-card-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-gift-preset") || "";
      const input = document.getElementById("gift-card-amount");
      if (input) input.value = v;
      clearGiftCardPresetSelection();
      btn.classList.add("is-selected");
      btn.setAttribute("aria-pressed", "true");
    });
  });

  const amountInput = document.getElementById("gift-card-amount");
  amountInput?.addEventListener("input", () => {
    const val = amountInput.value.trim();
    if (!val) {
      clearGiftCardPresetSelection();
      return;
    }
    const n = String(Number.parseFloat(val.replace(",", ".")));
    document.querySelectorAll(".gift-card-preset").forEach((b) => {
      const p = b.getAttribute("data-gift-preset");
      const match = p != null && n === p;
      b.classList.toggle("is-selected", match);
      b.setAttribute("aria-pressed", match ? "true" : "false");
    });
  });

  document.getElementById("gift-card-submit-btn")?.addEventListener("click", submitGiftCardLine);
}

/* Fonctions checkout/panier/paypal deplacees dans components/order-flow.js */

/* Fonctions formulaires/galerie deplacees dans components/forms-gallery.js */

/* Fonctions UI communes déplacées dans components/ui-common.js */

/* ── Init ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.loadPayPalClientIdFromNetlify === "function") {
    await window.loadPayPalClientIdFromNetlify();
  }
  if (typeof window.loadPricingFromSupabase === "function") {
    await window.loadPricingFromSupabase();
  }
  syncDisplayedPrices();
  orderCart = CartStore.load();
  setupBoxModal();
  setupAccessoryAddToCartButtons();
  setupGiftCardButtons();
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
  setupCustomRequestModal();
  setupProductGalleryModal();
});
