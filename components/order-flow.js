/* ── Commande modale + calcul ───────────────── */
let hasAddedToCartThisModalOpen = false;

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

function computeTotalEur(state, shippingFee = SHIPPING_EUR) {
  const sub = computeSubtotalArticles(state);
  if (sub == null) return null;
  return Math.round((sub + shippingFee) * 100) / 100;
}

function computeLineSubtotal(line) {
  if (!line) return 0;
  if (line.product === "gift-card") {
    const v = Number(line.giftAmount ?? line.subtotal ?? 0);
    return Math.round(v * 100) / 100;
  }
  if (line.product === "abo3Mois" || line.product === "aboAnnee") {
    return Math.round((BOX_ONE_SHOT_EUR[line.product] || 0) * 100) / 100;
  }
  if (line.product === "oreilles-chat" || line.product === "stand-triangle") {
    const unit = ACCESSORY_PRODUCTS[line.product]?.price || 0;
    const qty = Math.max(1, Number.parseInt(line.quantity || "1", 10) || 1);
    return Math.round(unit * qty * 100) / 100;
  }
  if (line.product && line.format) {
    return (
      computeSubtotalArticles({
        product: line.product,
        format: line.format,
        phrase: line.phrase || "",
        fourrure: line.fourrure || "",
        bicolore: Boolean(line.bicolore),
        bicoloreDetail: line.bicoloreDetail || "",
        prenomAddon: Boolean(line.prenomAddon),
        prenom: line.prenom || "",
        photoLink: line.photoLink || "",
        commentaire: line.commentaire || "",
        quantity: Math.max(1, Number.parseInt(line.quantity || "1", 10) || 1),
      }) || 0
    );
  }
  return Math.round(Number(line.subtotal || 0) * 100) / 100;
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
  const prenomInlineLabel = document.getElementById("order-prenom-inline-label");
  if (rowPre) {
    rowPre.hidden = !prenomAddon;
    if (!prenomAddon) {
      const inp = document.getElementById("order-prenom");
      if (inp) inp.value = "";
    }
  }
  if (prenomInlineLabel) {
    prenomInlineLabel.hidden = !prenomAddon;
  }

  const furHint = document.getElementById("order-fur-note");
  if (furHint) {
    furHint.hidden = !(fur === "blanc" || fur === "bleu_gris");
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
  if (line.product === "gift-card") {
    if (line.giftAmount) details.push(`Montant: ${formatEuro(line.giftAmount)}`);
    if (line.giftRecipientPrenom) details.push(`Pour: ${line.giftRecipientPrenom}`);
    if (line.commentaire) details.push(`Précisions: ${line.commentaire}`);
    details.push("Code → email de la commande (souvent sous 24 h)");
  }
  if (line.product === "abo3Mois" || line.product === "aboAnnee") {
    details.push("Paiement one shot");
    if (line.comment) details.push(line.comment);
    if (line.shippingCity) details.push(`Livraison: ${line.shippingPostal || ""} ${line.shippingCity}`.trim());
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
  if (line.commentaire && line.product !== "gift-card") details.push(`Note: ${line.commentaire}`);
  return details.join(" · ");
}

function buildBoxLineFromPlan(plan, intent, message, recipientName, recipientEmail, shipping) {
  if (plan === "aboMensuel") {
    return null;
  }
  const subtotal = BOX_ONE_SHOT_EUR[plan];
  if (!subtotal) return null;
  return {
    product: plan,
    quantity: 1,
    subtotal,
    comment: intent === "gift" ? "Cadeau" : "Pour moi",
    recipientName: recipientName || "",
    recipientEmail: recipientEmail || "",
    shippingName: shipping.fullName || "",
    shippingAddress: shipping.address1 || "",
    shippingPostal: shipping.postalCode || "",
    shippingCity: shipping.city || "",
    shippingEmail: shipping.email || "",
    commentaire: message || "",
  };
}

function getBoxShippingState() {
  return {
    fullName: document.getElementById("box-shipping-fullname")?.value.trim() || "",
    address1: document.getElementById("box-shipping-address1")?.value.trim() || "",
    postalCode: document.getElementById("box-shipping-postal")?.value.trim() || "",
    city: document.getElementById("box-shipping-city")?.value.trim() || "",
    email: document.getElementById("box-buyer-email")?.value.trim() || "",
  };
}

function validateBoxShippingState(state) {
  return Boolean(state.fullName && state.address1 && state.postalCode && state.city && state.email);
}

async function saveSubscriptionRequest({ plan, intent, buyerEmail, recipientName, recipientEmail, message, shipping }) {
  const requestType = intent === "gift" ? "info" : "info";
  return insertSupabase("subscription_requests", {
    type: requestType,
    email: buyerEmail,
    message: [
      `Plan: ${plan}`,
      `Intent: ${intent}`,
      shipping?.fullName ? `Livraison nom: ${shipping.fullName}` : "",
      shipping?.address1 ? `Livraison adresse: ${shipping.address1}` : "",
      shipping?.postalCode ? `Livraison CP: ${shipping.postalCode}` : "",
      shipping?.city ? `Livraison ville: ${shipping.city}` : "",
      recipientName ? `Destinataire: ${recipientName}` : "",
      recipientEmail ? `Email destinataire: ${recipientEmail}` : "",
      message || "",
    ].filter(Boolean).join("\n"),
  });
}

function computeCartTotal(shippingFee = SHIPPING_EUR) {
  const subtotal = orderCart.reduce((sum, line) => sum + Math.round(computeLineSubtotal(line) * 100), 0) / 100;
  if (!orderCart.length) return null;
  return Math.round((subtotal + shippingFee) * 100) / 100;
}

function computeCartSubtotal() {
  return orderCart.reduce((sum, line) => sum + Math.round(computeLineSubtotal(line) * 100), 0) / 100;
}

function hasOnlySubscriptionLines() {
  return (
    Array.isArray(orderCart) &&
    orderCart.length > 0 &&
    orderCart.every((line) => line?.product === "aboMensuel" || line?.product === "abo3Mois" || line?.product === "aboAnnee")
  );
}

function updateCartCountBadges() {
  const count = orderCart.length;
  const badge = document.getElementById("header-cart-count");
  const floatingBadge = document.getElementById("floating-cart-count");
  const floatingButton = document.getElementById("open-cart-fab");
  if (badge) badge.textContent = String(count);
  if (floatingBadge) floatingBadge.textContent = String(count);
  if (floatingButton) floatingButton.hidden = count < 1;
}

function renderOrderCart() {
  const list = document.getElementById("order-cart-list");
  const totalEl = document.getElementById("order-cart-total");
  const subtotalEl = document.getElementById("order-cart-subtotal");
  const shippingRow = document.getElementById("order-cart-shipping");
  const deliveryBlock = document.getElementById("order-cart-delivery");
  const checkoutBtn = document.getElementById("drawer-checkout-btn");
  const shippingEl = document.querySelector(".order-cart-shipping strong");
  const shippingState = getShippingState();
  const shippingFee = getShippingFeeFromState(shippingState);
  const subscriptionOnlyCart = hasOnlySubscriptionLines();
  if (!list || !totalEl) return;
  if (shippingEl) {
    shippingEl.textContent = subscriptionOnlyCart
      ? "Livraison : incluse"
      : isPickupDelivery(shippingState)
      ? "Retrait atelier : gratuit"
      : `Livraison : ${formatEuro(shippingFee)}`;
  }
  if (!orderCart.length) {
    list.innerHTML = "<p class='muted'>Votre panier est vide.</p>";
    totalEl.textContent = "0,00 €";
    if (subtotalEl) subtotalEl.textContent = "0,00 €";
    if (shippingRow) shippingRow.hidden = true;
    if (deliveryBlock) deliveryBlock.hidden = true;
    if (checkoutBtn) checkoutBtn.hidden = true;
    updateCheckoutSummary(0, 0, 0);
    updateCartCountBadges();
    toggleCartActionButtons();
    return;
  }
  if (shippingRow) shippingRow.hidden = false;
  if (deliveryBlock) deliveryBlock.hidden = subscriptionOnlyCart;
  if (checkoutBtn) checkoutBtn.hidden = false;

  list.innerHTML = orderCart
    .map(
      (line, idx) => `
      <article class="order-cart-item">
        <div class="order-cart-item-head">
          <strong>${lineLabel(line)}</strong>
          <button type="button" class="cart-remove-btn" data-cart-remove="${idx}">Supprimer</button>
        </div>
        <p class="muted">${lineDetail(line) || "Sans option"}</p>
        <p class="muted">${formatEuro(computeLineSubtotal(line) || 0)}</p>
      </article>
    `
    )
    .join("");

  const subtotal = computeCartSubtotal();
  if (subtotalEl) subtotalEl.textContent = formatEuro(subtotal);
  const total = computeCartTotal(shippingFee);
  totalEl.textContent = formatEuro(total);
  updateCheckoutSummary(subtotal, shippingFee, total);
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

function updateCheckoutSummary(subtotal, shippingFee, total) {
  const subEl = document.getElementById("checkout-summary-subtotal");
  const shipEl = document.getElementById("checkout-summary-shipping");
  const totalEl = document.getElementById("checkout-summary-total");
  if (subEl) subEl.textContent = formatEuro(subtotal || 0);
  if (shipEl) shipEl.textContent = formatEuro(shippingFee || 0);
  if (totalEl) totalEl.textContent = formatEuro(total || 0);
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
  const shippingState = getShippingState();
  const shippingFee = getShippingFeeFromState(shippingState);
  const singleTotal = computeTotalEur(state, shippingFee);
  const ok = validateOrder(state);
  const hasCart = orderCart.length > 0;
  const total = hasCart ? computeCartTotal(shippingFee) : singleTotal;
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
    const subArticles = lines.reduce((sum, line) => sum + Math.round(computeLineSubtotal(line) * 100), 0) / 100;
    const subStr = subArticles.toFixed(2);
    const nameLine = hasCart ? "LPS — Panier multi-produits" : buildPayPalDescription(state);
    const paypalItems = lines.map((line) => ({
      name: lineLabel(line).slice(0, 127),
      description: lineDetail(line).slice(0, 127),
      quantity: "1",
      unit_amount: { currency_code: "EUR", value: Number(computeLineSubtotal(line) || 0).toFixed(2) },
    }));

    orderPaypalButtons = paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "pay" },
      createOrder: (_data, actions) => {
        const freshShippingState = getShippingState();
        const paypalShipping = buildPayPalShippingAddress(freshShippingState);
        const freshShippingFee = getShippingFeeFromState(freshShippingState);
        const freshTotal = hasCart ? computeCartTotal(freshShippingFee) : computeTotalEur(state, freshShippingFee);
        if (!validateShippingState(freshShippingState)) {
          showToast("Merci de compléter vos coordonnées de livraison avant paiement.");
          throw new Error("Shipping fields missing");
        }
        return actions.order.create({
          application_context: {
            shipping_preference: isPickupDelivery(freshShippingState) ? "NO_SHIPPING" : "SET_PROVIDED_ADDRESS",
          },
          purchase_units: [
            {
              amount: {
                currency_code: "EUR",
                value: freshTotal.toFixed(2),
                breakdown: {
                  item_total: { currency_code: "EUR", value: subStr },
                  shipping: { currency_code: "EUR", value: freshShippingFee.toFixed(2) },
                },
              },
              items: [...paypalItems],
              description: nameLine.slice(0, 127),
              custom_id: hasCart ? `lps-cart-${Date.now()}` : buildPayPalCustomId(state),
              shipping: paypalShipping || undefined,
            },
          ],
        });
      },
      onApprove: async (_data, actions) => {
        const capture = await actions.order.capture();
        const latestShipping = getShippingState();
        const captureTotal = hasCart
          ? computeCartTotal(getShippingFeeFromState(latestShipping))
          : computeTotalEur(state, getShippingFeeFromState(latestShipping));
        await persistOrderToSupabase(capture, lines, captureTotal, latestShipping);
        showToast("Paiement reçu, merci ! Je prépare votre commande.");
        CartStore.clear();
        renderOrderCart();
        if (hint) hint.textContent = "Paiement confirmé. Merci !";
        closeCheckoutModal(document.getElementById("checkout-modal"));
        closeCartDrawer(document.getElementById("cart-drawer"), document.getElementById("cart-drawer-backdrop"));
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
  const canShow = hasAddedToCartThisModalOpen && CartStore.hasItems();
  if (continueBtn) continueBtn.hidden = !canShow;
  if (viewCartBtn) viewCartBtn.hidden = !canShow;
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
  ["order-phrase", "order-fourrure", "order-bicolore-detail", "order-prenom", "order-photo-link", "order-commentaire", "order-qty"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const fur = document.getElementById("order-fourrure");
  if (fur) fur.value = "";
  const qty = document.getElementById("order-qty");
  if (qty) qty.value = "1";
  document.getElementById("order-prenom-addon-no")?.click();
  hasAddedToCartThisModalOpen = false;
  toggleCartActionButtons();
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
  hasAddedToCartThisModalOpen = false;
  toggleCartActionButtons();
}

function bindOrderInputsForSummary() {
  ["order-product", "order-format", "order-phrase", "order-fourrure", "order-bicolore-detail", "order-prenom", "order-photo-link", "order-commentaire", "order-qty"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateOrderSummary);
    document.getElementById(id)?.addEventListener("change", updateOrderSummary);
  });
  document.querySelectorAll('input[name="order-prenom-addon"]').forEach((el) => el.addEventListener("change", updateOrderSummary));
  const formatSelect = document.getElementById("order-format");
  if (formatSelect) {
    formatSelect.addEventListener("change", () => syncOrderFormatPills(formatSelect.value));
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
  const shippingState = getShippingState();
  const shippingFee = getShippingFeeFromState(shippingState);
  const shippingLine = isPickupDelivery(shippingState) ? "Retrait atelier : gratuit" : `Livraison : ${shippingFee.toFixed(2)} €`;
  return [
    "Bonjour,",
    "",
    "Récapitulatif panier :",
    "",
    ...orderCart.flatMap((line) => [`${lineLabel(line)} — ${Number(computeLineSubtotal(line) || 0).toFixed(2)} €`, lineDetail(line) || "Sans option", ""]),
    shippingLine,
    `Total : ${total != null ? `${total.toFixed(2)} €` : "(à confirmer)"}`,
    "",
    "Merci !",
  ].join("\n");
}

function syncCheckoutDeliveryFields() {
  const shippingState = getShippingState();
  const subscriptionOnlyCart = hasOnlySubscriptionLines();
  const pickup = isPickupDelivery(shippingState);
  const note = document.getElementById("shipping-method-note");
  const checkoutShippingEl = document.getElementById("checkout-summary-shipping");
  if (note) note.hidden = subscriptionOnlyCart || !pickup;
  const deliveryRow = document.getElementById("checkout-delivery-row");
  if (deliveryRow) deliveryRow.hidden = subscriptionOnlyCart;
  document.querySelectorAll(".shipping-address-row").forEach((row) => (row.hidden = pickup));
  ["shipping-address1", "shipping-postal", "shipping-city"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.required = !pickup;
  });
  const shippingText = document.querySelector(".order-cart-shipping strong");
  if (shippingText) shippingText.textContent = subscriptionOnlyCart ? "Livraison : incluse" : pickup ? "Retrait atelier : gratuit" : `Livraison : ${formatEuro(SHIPPING_EUR)}`;
  if (checkoutShippingEl && subscriptionOnlyCart) checkoutShippingEl.textContent = "Incluse";
}

function openCartDrawer(drawer, drawerBackdrop) {
  if (!drawer || !drawerBackdrop) return;
  setModalState(drawer, true);
  setModalState(drawerBackdrop, true);
  const drawerPromoInput = document.getElementById("drawer-promo-code-input");
  if (drawerPromoInput && typeof window.getActivePromoCode === "function") {
    drawerPromoInput.value = window.getActivePromoCode() || "";
  }
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
  const promoInput = document.getElementById("promo-code-input");
  const drawerPromoInput = document.getElementById("drawer-promo-code-input");
  if (promoInput && typeof window.getActivePromoCode === "function") {
    promoInput.value = window.getActivePromoCode() || "";
  }
  if (drawerPromoInput && typeof window.getActivePromoCode === "function") {
    drawerPromoInput.value = window.getActivePromoCode() || "";
  }
  updateCheckoutSummary(computeCartSubtotal(), getShippingFeeFromState(getShippingState()), computeCartTotal(getShippingFeeFromState(getShippingState())));
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
  const openFabBtn = document.getElementById("open-cart-fab");
  const closeDrawerBtn = document.getElementById("close-cart-drawer");
  const drawer = document.getElementById("cart-drawer");
  const drawerBackdrop = document.getElementById("cart-drawer-backdrop");
  const checkoutModal = document.getElementById("checkout-modal");
  const closeCheckoutBtn = document.getElementById("close-checkout-modal");
  const deliveryMethodInputs = document.querySelectorAll('input[name="delivery-method"], input[name="delivery-method-checkout"]');
  const promoInput = document.getElementById("promo-code-input");
  const promoApplyBtn = document.getElementById("promo-apply-btn");
  const promoClearBtn = document.getElementById("promo-clear-btn");
  const promoFeedback = document.getElementById("promo-feedback");
  const drawerPromoInput = document.getElementById("drawer-promo-code-input");
  const drawerPromoApplyBtn = document.getElementById("drawer-promo-apply-btn");
  const drawerPromoClearBtn = document.getElementById("drawer-promo-clear-btn");
  const drawerPromoFeedback = document.getElementById("drawer-promo-feedback");

  const setPromoFeedback = (msg, isError = false) => {
    if (!promoFeedback) return;
    promoFeedback.textContent = msg || "";
    promoFeedback.style.color = isError ? "#a2362b" : "";
  };
  const setDrawerPromoFeedback = (msg, isError = false) => {
    if (!drawerPromoFeedback) return;
    drawerPromoFeedback.textContent = msg || "";
    drawerPromoFeedback.style.color = isError ? "#a2362b" : "";
  };

  document.querySelectorAll("[data-open-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-open-order");
      const presetProduct = raw && raw.length ? raw : "";
      const presetFormat = btn.getAttribute("data-order-format") || "";
      openOrderModal(presetProduct, presetFormat);
    });
  });

  closeBtn?.addEventListener("click", closeOrderModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeOrderModal();
  });
  bindOrderInputsForSummary();

  mailBtn?.addEventListener("click", () => {
    const hasCart = orderCart.length > 0;
    const state = getOrderState();
    const shippingState = getShippingState();
    const shippingFee = getShippingFeeFromState(shippingState);
    const total = hasCart ? computeCartTotal(shippingFee) : computeTotalEur(state, shippingFee);
    if (!hasCart && !validateOrder(state)) {
      showToast("Merci de compléter les champs obligatoires 🙏");
      return;
    }
    const bodyText = hasCart ? buildCartMailBody(total) : buildMailtoBody(state, total);
    const subject = encodeURIComponent("Commande Les Points Rebelles");
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });

  addCartBtn?.addEventListener("click", () => {
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
    hasAddedToCartThisModalOpen = true;
    renderOrderCart();
    schedulePayPalRender();
    showToast("Article ajouté au panier.");
  });

  continueBtn?.addEventListener("click", closeOrderModal);
  goCheckoutBtn?.addEventListener("click", () => {
    closeOrderModal();
    openCartDrawer(drawer, drawerBackdrop);
  });
  drawerCheckoutBtn?.addEventListener("click", () => {
    closeCartDrawer(drawer, drawerBackdrop);
    openCheckoutModal(checkoutModal);
  });

  openDrawerBtn?.addEventListener("click", () => openCartDrawer(drawer, drawerBackdrop));
  openFabBtn?.addEventListener("click", () => openCartDrawer(drawer, drawerBackdrop));
  closeDrawerBtn?.addEventListener("click", () => closeCartDrawer(drawer, drawerBackdrop));
  drawerBackdrop?.addEventListener("click", () => closeCartDrawer(drawer, drawerBackdrop));
  closeCheckoutBtn?.addEventListener("click", () => closeCheckoutModal(checkoutModal));
  checkoutModal?.addEventListener("click", (e) => {
    if (e.target === checkoutModal) closeCheckoutModal(checkoutModal);
  });

  clearCartBtn?.addEventListener("click", () => {
    CartStore.clear();
    renderOrderCart();
    schedulePayPalRender();
  });

  promoApplyBtn?.addEventListener("click", async () => {
    const code = promoInput?.value?.trim() || drawerPromoInput?.value?.trim() || "";
    if (!code) {
      setPromoFeedback("Entre un code promo.", true);
      return;
    }
    if (typeof window.applyPromoCode !== "function") {
      setPromoFeedback("Promo indisponible pour le moment.", true);
      return;
    }
    const res = await window.applyPromoCode(code);
    if (!res?.ok) {
      setPromoFeedback("Code invalide ou expiré.", true);
      setDrawerPromoFeedback("Code invalide ou expiré.", true);
      return;
    }
    setPromoFeedback(`Code ${res.code} appliqué ✅`);
    setDrawerPromoFeedback(`Code ${res.code} appliqué ✅`);
    if (promoInput) promoInput.value = res.code;
    if (drawerPromoInput) drawerPromoInput.value = res.code;
    renderOrderCart();
    updateOrderSummary();
    schedulePayPalRender();
  });

  promoClearBtn?.addEventListener("click", () => {
    if (typeof window.clearPromoCode === "function") {
      window.clearPromoCode();
    }
    if (promoInput) promoInput.value = "";
    if (drawerPromoInput) drawerPromoInput.value = "";
    setPromoFeedback("Code promo retiré.");
    setDrawerPromoFeedback("Code promo retiré.");
    renderOrderCart();
    updateOrderSummary();
    schedulePayPalRender();
  });
  drawerPromoApplyBtn?.addEventListener("click", () => promoApplyBtn?.click());
  drawerPromoClearBtn?.addEventListener("click", () => promoClearBtn?.click());

  ["shipping-fullname", "shipping-email", "shipping-phone", "shipping-address1", "shipping-address2", "shipping-postal", "shipping-city", "shipping-notes"].forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener("input", () => schedulePayPalRender());
    field.addEventListener("change", () => schedulePayPalRender());
  });

  deliveryMethodInputs.forEach((input) => {
    input.addEventListener("change", () => {
      syncDeliveryMethodToggles(input.value);
      syncCheckoutDeliveryFields();
      renderOrderCart();
      schedulePayPalRender();
    });
  });
  syncDeliveryMethodToggles(getSelectedDeliveryMethod());
  syncCheckoutDeliveryFields();
  toggleCartActionButtons();
}
