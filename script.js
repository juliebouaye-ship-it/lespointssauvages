/* ═══════════════════════════════════════════════
   Les Points Sauvages — script.js
   ═══════════════════════════════════════════════

   ╔══════════════════════════════════════════╗
   ║  ⚠️  VARIABLES À REMPLACER AVANT MISE EN  ║
   ║     LIGNE — voir section PAYPAL_LINKS    ║
   ╚══════════════════════════════════════════╝

   1. Remplace les "#" par tes vrais liens PayPal
      (voir PAYPAL_LINKS ci-dessous)
   2. Remplace l'email de contact
      (voir CONTACT_EMAIL ci-dessous)
   ─────────────────────────────────────────── */

/* ── Configuration ──────────────────────────── */

/**
 * Liens PayPal pour chaque produit.
 * Format : https://www.paypal.com/buy?hosted_button_id=XXXXXXXX
 * ou lien de paiement direct PayPal.me
 *
 * Laissez "#" pour les produits pas encore configurés :
 * ils s'afficheront en mode "à configurer".
 */
const PAYPAL_LINKS = {
  petitKit:    "#", // ← Remplacer : lien PayPal Kit DIY "Petit mot"
  petitFini:   "#", // ← Remplacer : lien PayPal Broderie finie "Petit mot"
  grandKit:    "#", // ← Remplacer : lien PayPal Kit DIY "Grand mot"
  grandFini:   "#", // ← Remplacer : lien PayPal Broderie finie "Grand mot"
  chatKit:     "#", // ← Remplacer : lien PayPal Kit DIY "Petit chat"
  chatFini:    "#", // ← Remplacer : lien PayPal Broderie finie "Petit chat"
  aboMensuel:  "#", // ← Remplacer : lien PayPal abonnement mensuel
  abo3Mois:    "#", // ← Remplacer : lien PayPal box 3 mois
  aboAnnee:    "#", // ← Remplacer : lien PayPal box 1 an
};

/**
 * Email qui reçoit les demandes personnalisées.
 */
const CONTACT_EMAIL = "contact@lespointssauvages.fr"; // ← Remplacer par ton email

/* ── PayPal buttons ─────────────────────────── */

function wirePaypalButtons() {
  const buttons = document.querySelectorAll("[data-paypal]");

  buttons.forEach((btn) => {
    const key = btn.getAttribute("data-paypal");
    const link = PAYPAL_LINKS[key];

    if (!link || link === "#") {
      // Lien non encore configuré : désactiver visuellement
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("title", "Lien de paiement à configurer");
      btn.style.opacity = "0.55";
      btn.style.cursor = "not-allowed";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("Lien de paiement bientôt disponible 🔧");
      });
      return;
    }

    // Lien configuré : redirection PayPal dans un nouvel onglet
    const productName = btn.getAttribute("data-product") || "ce produit";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // Sécurité : n'ouvrir que des liens http(s)
      if (/^https?:\/\//i.test(link)) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    });
  });
}

/* ── Custom order form ──────────────────────── */

function setupCustomOrderForm() {
  const form = document.getElementById("custom-order-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);

    const produit    = data.get("produit")     || "Non précisé";
    const format     = data.get("format")      || "Non précisé";
    const phrase     = data.get("phrase")      || "-";
    const prenom     = data.get("prenom")      || "-";
    const fourrure   = data.get("fourrure")    || "-";
    const commentaire = data.get("commentaire") || "-";

    // Validation minimale
    if (produit === "Non précisé" || format === "Non précisé") {
      showToast("Merci de choisir un produit et un format 🙏");
      return;
    }

    const lines = [
      "Bonjour,",
      "",
      "Je souhaite passer une commande personnalisée :",
      "",
      `Produit       : ${produit}`,
      `Format        : ${format}`,
      `Texte / phrase: ${phrase}`,
      `Prénom (chat) : ${prenom}`,
      `Fourrure      : ${fourrure}`,
      `Commentaire   : ${commentaire}`,
      "",
      "Merci !",
    ];

    const subject = encodeURIComponent("Commande personnalisée — Les Points Sauvages");
    const body    = encodeURIComponent(lines.join("\n"));

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

/* ── Contact email link ─────────────────────── */

function updateContactLinks() {
  const emailLinks = document.querySelectorAll("#contact-email-link, [data-email]");
  emailLinks.forEach((link) => {
    link.setAttribute("href", `mailto:${CONTACT_EMAIL}`);
    // Afficher l'adresse si le texte est vide ou identique
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

/* ── Init ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  wirePaypalButtons();
  setupCustomOrderForm();
  updateContactLinks();
  setupReveal();
  setFooterYear();
});
