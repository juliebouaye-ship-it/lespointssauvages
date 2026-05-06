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
  const openBtn = document.getElementById("open-custom-request-modal");
  const closeBtn = document.getElementById("close-custom-request-modal");
  const form = document.getElementById("custom-request-form");
  if (!modal || !openBtn || !closeBtn || !form) return;

  const closeModal = () => {
    setModalState(modal, false);
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", () => {
    setModalState(modal, true);
    document.body.style.overflow = "hidden";
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
    imageEl.style.setProperty("--gallery-rotation", `${current.rotation || 0}deg`);
    captionEl.textContent = `${current.alt} (${galleryIndex + 1}/${galleryItems.length})`;
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
      titleEl.textContent = `Photos - ${title}`;
      renderCurrent();
      setModalState(modal, true);
      document.body.style.overflow = "hidden";
    });
  });
}
