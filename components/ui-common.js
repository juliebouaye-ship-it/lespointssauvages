/* ── UI helpers partagés ────────────────────── */

function updateContactLinks() {
  const emailLinks = document.querySelectorAll("#contact-email-link, [data-email]");
  emailLinks.forEach((link) => {
    link.setAttribute("href", `mailto:${CONTACT_EMAIL}`);
    if (!link.textContent.trim() || link.textContent.includes("contact@lespointssauvages")) {
      link.textContent = CONTACT_EMAIL;
    }
  });
}

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
  toast.classList.remove("show");
  // Force reflow so rapid consecutive toasts always animate correctly.
  void toast.offsetWidth;
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

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
    const giftCard = document.getElementById("gift-card-modal");
    if (giftCard?.classList.contains("is-open")) {
      setModalState(giftCard, false);
      document.body.style.overflow = "";
      document.getElementById("open-gift-card-modal")?.focus();
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
      return;
    }
    const customRequest = document.getElementById("custom-request-modal");
    if (customRequest?.classList.contains("is-open")) {
      setModalState(customRequest, false);
      document.body.style.overflow = "";
      event.preventDefault();
      return;
    }
    const boxModal = document.getElementById("box-modal");
    if (boxModal?.classList.contains("is-open")) {
      setModalState(boxModal, false);
      document.body.style.overflow = "";
      event.preventDefault();
      return;
    }
    const productGallery = document.getElementById("photo-gallery-modal");
    if (productGallery?.classList.contains("is-open")) {
      setModalState(productGallery, false);
      document.body.style.overflow = "";
      event.preventDefault();
    }
  });
}
