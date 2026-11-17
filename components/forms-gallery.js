/* ── Formulaires et galerie ─────────────────── */

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
      if (typeof notifyAdmin === "function") {
        await notifyAdmin("contact_request_created", "Nouvelle demande de contact", {
          name: name || "",
          email,
          message_preview: message.slice(0, 180),
        });
      }
      form.reset();
      showToast("Message envoyé. Merci !");
      return;
    }
    if (result.missingConfig) {
      const subject = encodeURIComponent("Contact Les Points Rebelles");
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
  const openManageBtn = document.getElementById("open-subscription-manage-top");
  openManageBtn?.addEventListener("click", () => {
    if (typeEl) typeEl.value = "pause";
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
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
    const type = document.getElementById("subscription-type")?.value || "info";
    const email = document.getElementById("subscription-email")?.value.trim() || "";
    const message = document.getElementById("subscription-message")?.value.trim() || "";
    if (!email || !message) {
      showToast("Merci de compléter les champs obligatoires.");
      return;
    }
    const result = await insertSupabase("subscription_requests", { type, email, message });
    if (result.ok) {
      if (typeof notifyAdmin === "function") {
        await notifyAdmin("subscription_request_created", "Nouvelle demande abonnement", {
          type,
          email,
          message_preview: message.slice(0, 180),
        });
      }
      form.reset();
      setModalState(modal, false);
      document.body.style.overflow = "";
      showToast("Demande envoyée. Je reviens vers vous rapidement.");
      return;
    }
    if (result.missingConfig) {
      const subject = encodeURIComponent("Demande abonnement Les Points Rebelles");
      const body = encodeURIComponent(`Type: ${type}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    showToast("Impossible d'envoyer pour le moment.");
  });
}

function setupCustomRequestModal() {
  const modal = document.getElementById("custom-request-modal");
  const openBtns = document.querySelectorAll("#open-custom-request-modal, [data-open-custom-request]");
  const closeBtn = document.getElementById("close-custom-request-modal");
  const form = document.getElementById("custom-request-form");
  if (!modal || !openBtns.length || !closeBtn || !form) return;

  const closeModal = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
  };

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prefill = btn.getAttribute("data-custom-request-prefill") || "";
      const titleEl = document.getElementById("custom-request-modal-title");
      if (titleEl) titleEl.textContent = btn.getAttribute("data-custom-request-title") || "Demander un motif personnalisé";
      const messageEl = document.getElementById("custom-request-message");
      if (prefill && messageEl && !messageEl.value.trim()) messageEl.value = prefill;
      setModalState(modal, true);
      document.body.style.overflow = "hidden";
    });
  });
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("custom-request-name")?.value.trim() || "";
    const email = document.getElementById("custom-request-email")?.value.trim() || "";
    const message = document.getElementById("custom-request-message")?.value.trim() || "";
    const deadline = document.getElementById("custom-request-deadline")?.value.trim() || "";
    if (!email || !message) {
      showToast("Merci de compléter l'email et votre idée.");
      return;
    }
    const composedMessage = [
      "[Motif personnalisé]",
      message,
      deadline ? `Date souhaitée : ${deadline}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await insertSupabase("contact_requests", {
      name: name || null,
      email,
      message: composedMessage,
    });
    if (result.ok) {
      if (typeof notifyAdmin === "function") {
        await notifyAdmin("contact_request_created", "Nouvelle demande personnalisée", {
          name: name || "",
          email,
          message_preview: composedMessage.slice(0, 180),
        });
      }
      form.reset();
      closeModal();
      showToast("Demande envoyée. Je vous réponds rapidement.");
      return;
    }
    if (result.missingConfig) {
      const subject = encodeURIComponent("Demande motif personnalisé - Les Points Rebelles");
      const body = encodeURIComponent(`${name ? `Prénom: ${name}\n` : ""}${composedMessage}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    showToast("Impossible d'envoyer pour le moment.");
  });
}

function setupProductGalleryModal() {
  const modal = document.getElementById("photo-gallery-modal");
  const closeBtn = document.getElementById("close-photo-gallery-modal");
  const titleEl = document.getElementById("photo-gallery-title");
  const imageEl = document.getElementById("photo-gallery-image");
  const captionEl = document.getElementById("photo-gallery-caption");
  const prevBtn = document.getElementById("photo-gallery-prev");
  const nextBtn = document.getElementById("photo-gallery-next");
  const openBtns = document.querySelectorAll("[data-open-gallery]");
  if (!modal || !closeBtn || !titleEl || !imageEl || !captionEl || !prevBtn || !nextBtn || !openBtns.length) return;

  let galleryItems = [];
  let galleryIndex = 0;
  let imageFallbackActive = false;
  let titleFromCaption = false;

  const resolveImageFallback = (src) => {
    if (!src) return null;
    const normalized = src.split("?")[0];
    const match = normalized.match(/\.(jpe?g|png|webp)$/i);
    if (!match) return null;
    const ext = match[1].toLowerCase();
    const alternatives = ["jpg", "jpeg", "png", "webp"].filter((candidate) => candidate !== ext);
    const base = normalized.slice(0, -match[0].length);
    return alternatives.length ? `${base}.${alternatives[0]}` : null;
  };

  imageEl.addEventListener("error", () => {
    if (imageFallbackActive) {
      imageFallbackActive = false;
      return;
    }
    const fallbackSrc = resolveImageFallback(imageEl.src);
    if (!fallbackSrc) return;
    imageFallbackActive = true;
    imageEl.src = fallbackSrc;
  });

  const renderCurrent = () => {
    if (!galleryItems.length) return;
    const current = galleryItems[galleryIndex];
    imageFallbackActive = false;
    imageEl.src = current.src;
    imageEl.alt = current.alt;
    const rotation = Number(current.rotation) || 0;
    if (rotation) {
      imageEl.style.setProperty("--gallery-rotation", `${rotation}deg`);
      imageEl.classList.add("is-rotated");
    } else {
      imageEl.style.removeProperty("--gallery-rotation");
      imageEl.classList.remove("is-rotated");
    }
    if (titleFromCaption) {
      titleEl.textContent = current.alt;
      captionEl.textContent =
        galleryItems.length > 1 ? `${galleryIndex + 1} / ${galleryItems.length}` : "";
    } else {
      captionEl.textContent = `${current.alt} (${galleryIndex + 1}/${galleryItems.length})`;
    }
    prevBtn.disabled = galleryItems.length <= 1;
    nextBtn.disabled = galleryItems.length <= 1;
  };

  const closeModal = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
  };

  prevBtn.addEventListener("click", () => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex - 1 + galleryItems.length) % galleryItems.length;
    renderCurrent();
  });

  nextBtn.addEventListener("click", () => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + 1) % galleryItems.length;
    renderCurrent();
  });

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const rawImages = btn.getAttribute("data-gallery-images") || "";
      const rawAlts = btn.getAttribute("data-gallery-alts") || "";
      const rawRotations = btn.getAttribute("data-gallery-rotations") || "";
      const title = btn.getAttribute("data-gallery-title") || "Photos produit";
      titleFromCaption = btn.hasAttribute("data-gallery-title-from-caption");
      const images = rawImages.split("|").map((value) => value.trim()).filter(Boolean);
      const alts = rawAlts.split("|").map((value) => value.trim());
      const rotations = rawRotations
        .split("|")
        .map((value) => Number.parseInt(value.trim(), 10))
        .map((value) => (Number.isFinite(value) ? value : 0));
      if (!images.length) return;
      galleryItems = images.map((src, index) => ({
        src,
        alt: alts[index] || `Photo ${index + 1}`,
        rotation: rotations[index] || 0,
      }));
      galleryIndex = 0;
      if (!titleFromCaption) {
        titleEl.textContent = `Photos - ${title}`;
      }
      renderCurrent();
      setModalState(modal, true);
      document.body.style.overflow = "hidden";
    });
  });
}

/* ── Rétractation : « Renoncer au contrat ici » ──
   Parcours en 2 étapes (déclaration, puis « Confirmer la rétractation »).
   L'accusé de réception est envoyé par la fonction Netlify withdrawal-request. */
const WITHDRAWAL_HASH = "#renoncer-au-contrat";

function setupWithdrawalModal() {
  const modal = document.getElementById("withdrawal-modal");
  const form = document.getElementById("withdrawal-form");
  const confirmStep = document.getElementById("withdrawal-confirm");
  const doneStep = document.getElementById("withdrawal-done");
  const closeBtn = document.getElementById("close-withdrawal-modal");
  const confirmBtn = document.getElementById("withdrawal-confirm-btn");
  const backBtn = document.getElementById("withdrawal-back-btn");
  const feedback = document.getElementById("withdrawal-feedback");
  if (!modal || !form || !confirmStep || !doneStep) return;

  const field = (id) => document.getElementById(id);
  const read = () => ({
    email: field("withdrawal-email")?.value.trim() || "",
    orderRef: field("withdrawal-order")?.value.trim() || "",
    details: field("withdrawal-details")?.value.trim() || "",
    website: field("withdrawal-website")?.value || "",
  });
  const showStep = (step) => {
    form.hidden = step !== "form";
    confirmStep.hidden = step !== "confirm";
    doneStep.hidden = step !== "done";
  };

  const open = () => {
    showStep("form");
    if (feedback) feedback.textContent = "";
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => field("withdrawal-email")?.focus(), 50);
  };
  const close = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
    if (window.location.hash === WITHDRAWAL_HASH) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  document.querySelectorAll(".js-open-withdrawal").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("close-legal-modal")?.click();
      open();
    });
  });
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = read();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !data.orderRef) {
      showToast("Merci d'indiquer votre email et votre numéro de commande.");
      return;
    }
    field("withdrawal-recap-order").textContent = data.orderRef;
    field("withdrawal-recap-details").textContent = data.details || "Toute la commande";
    field("withdrawal-recap-email").textContent = data.email;
    if (feedback) feedback.textContent = "";
    showStep("confirm");
    confirmBtn?.focus();
  });

  backBtn?.addEventListener("click", () => showStep("form"));

  confirmBtn?.addEventListener("click", async () => {
    const data = read();
    confirmBtn.disabled = true;
    if (feedback) feedback.textContent = "Envoi en cours…";
    try {
      const res = await fetch("/.netlify/functions/withdrawal-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) throw new Error(result.error || `http_${res.status}`);
      field("withdrawal-done-text").textContent =
        `Votre demande a été reçue le ${result.receivedAtText}. Un accusé de réception vient d'être envoyé à ${data.email} : gardez-le, il fait foi. Je reviens vers vous très vite.`;
      form.reset();
      showStep("done");
    } catch {
      if (feedback) {
        feedback.textContent = "";
        const msg = document.createElement("span");
        msg.textContent = "L'envoi n'a pas abouti. Réessayez, ou écrivez-moi à ";
        const link = document.createElement("a");
        link.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Rétractation — commande " + data.orderRef)}&body=${encodeURIComponent(`Je renonce à ma commande ${data.orderRef}.\nArticles : ${data.details || "toute la commande"}\nEmail : ${data.email}`)}`;
        link.textContent = CONTACT_EMAIL;
        feedback.append(msg, link, document.createTextNode(" : votre email fera foi."));
      }
    } finally {
      confirmBtn.disabled = false;
    }
  });

  /* Lien direct (ex. depuis la page PLA) : /#renoncer-au-contrat */
  const openFromHash = () => {
    if (window.location.hash === WITHDRAWAL_HASH) open();
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
}

/* Liens « conditions générales de vente » ouverts depuis le paiement ou la box */
function setupLegalLinks() {
  document.getElementById("checkout-cgv")?.addEventListener("change", () => {
    if (typeof schedulePayPalRender === "function") schedulePayPalRender();
  });
  document.querySelectorAll(".js-open-legal").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("open-legal-modal")?.click();
    });
  });
}
