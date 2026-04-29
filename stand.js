let standSupabaseClient = null;
const STAND_SHIPPING_EUR = 3.5;
const STAND_TOKEN_KEY = "lps-stand-dashboard-token";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${`${d.getDate()}`.padStart(2, "0")}/${`${d.getMonth() + 1}`.padStart(2, "0")} ${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
}

function euros(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

function num(elId) {
  const raw = document.getElementById(elId)?.value ?? "0";
  const parsed = Number.parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStandClient() {
  if (standSupabaseClient) return standSupabaseClient;
  if (!window.supabase?.createClient || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  standSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return standSupabaseClient;
}

function renderRows(rows) {
  const tbody = document.getElementById("stand-orders-body");
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7">Aucune fiche pour le moment.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (row) => `<tr>
      <td>${escapeHtml(formatDate(row.created_at))}</td>
      <td>${escapeHtml(row.customer_name || "")}</td>
      <td>${escapeHtml(row.customer_email || "")}</td>
      <td>${escapeHtml(row.shipping_method === "ship" ? "Livraison" : "Retrait")}</td>
      <td>${escapeHtml(euros(row.amount_total))}</td>
      <td>${escapeHtml(euros(row.amount_remaining))}</td>
      <td>${escapeHtml(row.pos_reference || "")}</td>
    </tr>`
    )
    .join("");
}

function getStandDashboardToken() {
  let t = sessionStorage.getItem(STAND_TOKEN_KEY);
  if (!t) {
    t = window.prompt("Mot de passe tableau de bord marché")?.trim();
    if (!t) return null;
    sessionStorage.setItem(STAND_TOKEN_KEY, t);
  }
  return t;
}

async function loadOrders() {
  const feedback = document.getElementById("stand-dashboard-feedback");
  const tbody = document.getElementById("stand-orders-body");
  const token = getStandDashboardToken();
  if (!token) {
    if (feedback) feedback.textContent = "Liste masquée : mot de passe annulé.";
    if (tbody) tbody.innerHTML = `<tr><td colspan="7">Session tableau non ouverte.</td></tr>`;
    return;
  }

  if (feedback) feedback.textContent = "Chargement...";
  const res = await fetch("/.netlify/functions/stand-orders-list", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });

  if (res.status === 401) {
    sessionStorage.removeItem(STAND_TOKEN_KEY);
    if (feedback) feedback.textContent = "Mot de passe refusé ou révoqué : Rafraîchir pour saisir à nouveau.";
    if (tbody) tbody.innerHTML = `<tr><td colspan="7">Non autorisé.</td></tr>`;
    return;
  }

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error ? JSON.stringify(err.error) : res.statusText;
    } catch {
      detail = res.statusText;
    }
    if (feedback) feedback.textContent = `Erreur liste (${res.status}): ${detail}`;
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    if (feedback) feedback.textContent = "Réponse tableau invalide.";
    return;
  }
  renderRows(Array.isArray(data) ? data : []);
  if (feedback) feedback.textContent = `${(Array.isArray(data) ? data : []).length} fiche(s) chargée(s).`;
}

function clearStandDashboardSession() {
  sessionStorage.removeItem(STAND_TOKEN_KEY);
  const feedback = document.getElementById("stand-dashboard-feedback");
  const tbody = document.getElementById("stand-orders-body");
  if (feedback) feedback.textContent = "Session fermée. Cliquez « Rafraîchir la liste » pour ouvrir une nouvelle session.";
  if (tbody) tbody.innerHTML = `<tr><td colspan="7">Liste masquée.</td></tr>`;
}

function setFormFeedback(msg, isError = false) {
  const el = document.getElementById("stand-feedback");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#a2362b" : "";
}

function getShippingFee() {
  return document.getElementById("delivery-method")?.value === "ship" ? STAND_SHIPPING_EUR : 0;
}

function derivePaymentStatus(total, paid) {
  if (paid <= 0) return "pending";
  if (paid + 0.001 >= total) return "paid";
  return "deposit";
}

function paymentStatusLabel(status) {
  if (status === "paid") return "Payé total";
  if (status === "deposit") return "Acompte";
  return "À encaisser plus tard";
}

function refreshTotals() {
  const products = num("amount-products");
  const shipping = getShippingFee();
  const paid = num("amount-paid");
  const total = products + shipping;
  const due = Math.max(0, total - paid);
  const paymentStatus = derivePaymentStatus(total, paid);

  document.getElementById("sum-products").textContent = euros(products);
  document.getElementById("sum-shipping").textContent = euros(shipping);
  document.getElementById("sum-total").textContent = euros(total);
  document.getElementById("sum-paid").textContent = euros(paid);
  document.getElementById("sum-due").textContent = euros(due);
  document.getElementById("sum-payment-status").textContent = paymentStatusLabel(paymentStatus);
}

function syncDeliveryUI() {
  const isShip = document.getElementById("delivery-method")?.value === "ship";
  const shippingFields = document.getElementById("shipping-fields");
  if (shippingFields) shippingFields.hidden = !isShip;
  refreshTotals();
}

function openStandModal() {
  const backdrop = document.getElementById("stand-modal-backdrop");
  backdrop?.classList.add("is-open");
  backdrop?.setAttribute("aria-hidden", "false");
}

function closeStandModal() {
  const backdrop = document.getElementById("stand-modal-backdrop");
  backdrop?.classList.remove("is-open");
  backdrop?.setAttribute("aria-hidden", "true");
}

function resetForm() {
  const form = document.getElementById("stand-form");
  if (!form) return;
  form.reset();
  document.getElementById("amount-products").value = "0";
  document.getElementById("amount-paid").value = "0";
  document.getElementById("delivery-method").value = "pickup";
  syncDeliveryUI();
  setFormFeedback("");
}

async function saveStandOrder(event) {
  event.preventDefault();
  setFormFeedback("");
  const name = document.getElementById("customer-name").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const details = document.getElementById("order-details").value.trim();
  const method = document.getElementById("delivery-method").value;

  if (!name || !email || !details) {
    setFormFeedback("Nom, email et détails de commande sont obligatoires.", true);
    return;
  }

  if (method === "ship") {
    const addr = document.getElementById("shipping-address1").value.trim();
    const cp = document.getElementById("shipping-postal").value.trim();
    const city = document.getElementById("shipping-city").value.trim();
    if (!addr || !cp || !city) {
      setFormFeedback("Pour une livraison, renseigne rue + code postal + ville.", true);
      return;
    }
  }

  const products = num("amount-products");
  const shipping = getShippingFee();
  const paid = num("amount-paid");
  const total = products + shipping;
  const remaining = Math.max(0, total - paid);
  const paymentStatus = derivePaymentStatus(total, paid);

  const client = getStandClient();
  if (!client) {
    setFormFeedback("Supabase non configuré.", true);
    return;
  }

  const { error } = await client.from("stand_orders").insert({
    customer_name: name,
    customer_phone: document.getElementById("customer-phone").value.trim() || null,
    customer_email: email,
    order_details: details,
    amount_products: products,
    shipping_method: method,
    shipping_fee: shipping,
    amount_total: total,
    amount_paid: paid,
    amount_remaining: remaining,
    payment_status: paymentStatus,
    order_status: "new",
    pos_reference: document.getElementById("pos-reference").value.trim() || null,
    shipping_address_1: method === "ship" ? document.getElementById("shipping-address1").value.trim() || null : null,
    shipping_city: method === "ship" ? document.getElementById("shipping-city").value.trim() || null : null,
    shipping_postal_code: method === "ship" ? document.getElementById("shipping-postal").value.trim() || null : null,
    deadline_date: document.getElementById("deadline-date").value || null,
    deadline_note: document.getElementById("deadline-note").value.trim() || null,
    internal_notes: document.getElementById("notes").value.trim() || null,
  });

  if (error) {
    setFormFeedback(`Erreur enregistrement: ${error.message}`, true);
    return;
  }

  resetForm();
  closeStandModal();
  await loadOrders();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("open-stand-modal")?.addEventListener("click", openStandModal);
  document.getElementById("close-stand-modal")?.addEventListener("click", closeStandModal);
  document.getElementById("stand-modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target?.id === "stand-modal-backdrop") closeStandModal();
  });
  document.getElementById("reload-stand-orders")?.addEventListener("click", loadOrders);
  document.getElementById("stand-clear-dashboard-session")?.addEventListener("click", clearStandDashboardSession);
  document.getElementById("delivery-method")?.addEventListener("change", syncDeliveryUI);
  ["amount-products", "amount-paid"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", refreshTotals);
  });
  document.getElementById("stand-form")?.addEventListener("submit", saveStandOrder);
  document.getElementById("reset-stand-form")?.addEventListener("click", resetForm);
  syncDeliveryUI();
  refreshTotals();
  loadOrders();
});
