/**
 * Espace mercerie : saisie des kits vendus.
 * Tout passe par /.netlify/functions/mercerie-api (jeton de session signé côté serveur).
 */

const MERCERIE_TOKEN_KEY = "lps-mercerie-token";
const MERCERIE_ENDPOINT = "/.netlify/functions/mercerie-api";

let catalog = [];
let identity = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function euros(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")} €`;
}

function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function setFeedback(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.dataset.state = isError ? "error" : "";
}

function getToken() {
  return sessionStorage.getItem(MERCERIE_TOKEN_KEY) || "";
}

function setToken(token) {
  if (token) sessionStorage.setItem(MERCERIE_TOKEN_KEY, token);
  else sessionStorage.removeItem(MERCERIE_TOKEN_KEY);
}

async function api(action, payload = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(MERCERIE_ENDPOINT, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    return { ok: false, status: 0, error: "Connexion impossible. Vérifiez le réseau." };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return { ok: false, status: res.status, error: data?.error || `Erreur ${res.status}` };
  }
  return { ok: true, status: res.status, data: data || {} };
}

/* ── Écrans ───────────────────────────────────── */

function showLogin(message = "", isError = false) {
  identity = null;
  document.getElementById("mercerie-login").hidden = false;
  document.getElementById("mercerie-header").hidden = true;
  document.getElementById("mercerie-entry").hidden = true;
  document.getElementById("mercerie-history").hidden = true;
  setFeedback("mercerie-login-feedback", message, isError);
}

function showApp() {
  document.getElementById("mercerie-login").hidden = true;
  document.getElementById("mercerie-header").hidden = false;
  document.getElementById("mercerie-history").hidden = false;
  const isShop = identity?.role === "shop";
  document.getElementById("mercerie-entry").hidden = !isShop;
  document.getElementById("mercerie-shop-filter-row").hidden = !(identity?.role === "admin");
  document.getElementById("mercerie-col-shop").hidden = !(identity?.role === "admin");

  const label = identity?.city ? `${identity.name} · ${identity.city}` : identity?.name || "";
  const identityEl = document.getElementById("mercerie-identity");
  if (identityEl) identityEl.textContent = label;

  const title = document.getElementById("mercerie-history-title");
  if (title) title.textContent = identity?.role === "admin" ? "Toutes les merceries" : "Ce mois-ci";
}

/* ── Saisie ───────────────────────────────────── */

function renderCatalog() {
  const host = document.getElementById("mercerie-catalog");
  if (!host) return;
  host.innerHTML = catalog
    .map(
      (item) => `<div class="merc-line" data-product="${escapeHtml(item.key)}" data-format="${escapeHtml(item.format)}">
        <div>
          <div class="merc-line-label">${escapeHtml(item.label)}</div>
          <label class="merc-line-price">
            Prix unitaire
            <input type="number" class="merc-price" step="0.5" min="0" max="9999" value="${Number(item.defaultPrice).toFixed(2)}" aria-label="Prix unitaire ${escapeHtml(item.label)}" />
            €
          </label>
        </div>
        <div class="merc-stepper">
          <button type="button" class="merc-minus" aria-label="Retirer un ${escapeHtml(item.label)}">−</button>
          <input type="number" class="merc-qty" inputmode="numeric" min="0" max="999" step="1" value="0" aria-label="Quantité ${escapeHtml(item.label)}" />
          <button type="button" class="merc-plus" aria-label="Ajouter un ${escapeHtml(item.label)}">+</button>
        </div>
      </div>`
    )
    .join("");
  refreshFormTotal();
}

function readCatalogLines() {
  return Array.from(document.querySelectorAll("#mercerie-catalog .merc-line")).map((line) => {
    const quantity = Number.parseInt(line.querySelector(".merc-qty")?.value || "0", 10);
    const unitPrice = Number.parseFloat(String(line.querySelector(".merc-price")?.value || "0").replace(",", "."));
    return {
      productKey: line.dataset.product,
      format: line.dataset.format,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
      unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0,
    };
  });
}

function refreshFormTotal() {
  const total = readCatalogLines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const el = document.getElementById("mercerie-form-total");
  if (el) el.textContent = euros(total);
}

function bumpQuantity(line, delta) {
  const input = line.querySelector(".merc-qty");
  if (!input) return;
  const current = Number.parseInt(input.value || "0", 10);
  const next = Math.min(999, Math.max(0, (Number.isFinite(current) ? current : 0) + delta));
  input.value = String(next);
  refreshFormTotal();
}

function resetSaleForm() {
  document.querySelectorAll("#mercerie-catalog .merc-qty").forEach((input) => {
    input.value = "0";
  });
  const note = document.getElementById("mercerie-note");
  if (note) note.value = "";
  const soldOn = document.getElementById("mercerie-sold-on");
  if (soldOn) soldOn.value = todayIso();
  refreshFormTotal();
}

async function submitSale(event) {
  event.preventDefault();
  setFeedback("mercerie-sale-feedback", "");

  const items = readCatalogLines().filter((line) => line.quantity > 0);
  if (!items.length) {
    setFeedback("mercerie-sale-feedback", "Indiquez au moins une quantité.", true);
    return;
  }

  const button = document.getElementById("mercerie-save");
  if (button) button.disabled = true;
  setFeedback("mercerie-sale-feedback", "Enregistrement...");

  const result = await api("record", {
    soldOn: document.getElementById("mercerie-sold-on")?.value || todayIso(),
    note: document.getElementById("mercerie-note")?.value || "",
    items,
  });

  if (button) button.disabled = false;

  if (!result.ok) {
    if (result.status === 401) return expireSession();
    setFeedback("mercerie-sale-feedback", result.error, true);
    return;
  }

  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  resetSaleForm();
  setFeedback("mercerie-sale-feedback", `${count} kit(s) enregistré(s). Merci !`);
  await loadHistory();
}

/* ── Récapitulatif ────────────────────────────── */

function renderRecap(rows) {
  const host = document.getElementById("mercerie-recap");
  if (!host) return;

  const perProduct = new Map();
  let totalQty = 0;
  let totalEur = 0;

  rows.forEach((row) => {
    const key = `${row.product_key}|${row.format}`;
    const entry = perProduct.get(key) || { label: row.product_label, quantity: 0 };
    entry.quantity += Number(row.quantity || 0);
    perProduct.set(key, entry);
    totalQty += Number(row.quantity || 0);
    totalEur += Number(row.total_eur || 0);
  });

  const tiles = Array.from(perProduct.values()).map(
    (entry) => `<div class="merc-recap-tile"><span>${escapeHtml(entry.label)}</span><strong>${entry.quantity}</strong></div>`
  );
  tiles.push(`<div class="merc-recap-tile"><span>Total kits</span><strong>${totalQty}</strong></div>`);
  tiles.push(`<div class="merc-recap-tile"><span>Chiffre d'affaires</span><strong>${escapeHtml(euros(totalEur))}</strong></div>`);
  host.innerHTML = tiles.join("");
}

function renderRows(rows) {
  const tbody = document.getElementById("mercerie-rows");
  if (!tbody) return;
  const isAdmin = identity?.role === "admin";
  const colspan = isAdmin ? 7 : 6;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${colspan}">Aucune vente notée pour ce mois.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `<tr>
      <td>${escapeHtml(formatDate(row.sold_on))}</td>
      ${isAdmin ? `<td>${escapeHtml(row.shop_name || "")}</td>` : ""}
      <td>${escapeHtml(row.product_label || "")}</td>
      <td>${escapeHtml(String(row.quantity ?? ""))}</td>
      <td>${escapeHtml(euros(row.total_eur))}</td>
      <td>${escapeHtml(row.note || "")}</td>
      <td><button type="button" class="merc-row-delete" data-id="${escapeHtml(String(row.id))}" aria-label="Supprimer la ligne du ${escapeHtml(formatDate(row.sold_on))}">×</button></td>
    </tr>`
    )
    .join("");
}

function renderShopOptions(shops) {
  const select = document.getElementById("mercerie-shop-filter");
  if (!select) return;
  const current = select.value;
  select.innerHTML =
    `<option value="">Toutes</option>` +
    shops
      .map(
        (shop) =>
          `<option value="${escapeHtml(String(shop.id))}">${escapeHtml(shop.name)}${shop.is_active === false ? " (inactive)" : ""}</option>`
      )
      .join("");
  if (current) select.value = current;
}

async function loadHistory() {
  setFeedback("mercerie-history-feedback", "Chargement...");
  const month = document.getElementById("mercerie-month")?.value || todayIso().slice(0, 7);
  const shopId = document.getElementById("mercerie-shop-filter")?.value || "";

  const result = await api("list", { month, shopId: shopId ? Number(shopId) : undefined });
  if (!result.ok) {
    if (result.status === 401) return expireSession();
    setFeedback("mercerie-history-feedback", result.error, true);
    return;
  }

  const { rows = [], shops = [], catalog: freshCatalog } = result.data;
  if (Array.isArray(freshCatalog) && freshCatalog.length) catalog = freshCatalog;
  if (identity?.role === "admin") renderShopOptions(shops);
  renderRecap(rows);
  renderRows(rows);
  setFeedback("mercerie-history-feedback", `${rows.length} ligne(s) sur le mois.`);
}

async function deleteRow(id) {
  if (!window.confirm("Supprimer cette ligne ?")) return;
  const result = await api("remove", { id: Number(id) });
  if (!result.ok) {
    if (result.status === 401) return expireSession();
    setFeedback("mercerie-history-feedback", result.error, true);
    return;
  }
  await loadHistory();
}

/* ── Session ──────────────────────────────────── */

function expireSession() {
  setToken("");
  showLogin("Session expirée : entrez à nouveau le mot de passe.", true);
}

function logout() {
  setToken("");
  showLogin("Vous êtes déconnectée.");
  const password = document.getElementById("mercerie-password");
  if (password) password.value = "";
}

async function startSession(data) {
  identity = data.identity || null;
  catalog = Array.isArray(data.catalog) ? data.catalog : [];
  // Nouvelle session = mois courant, et pas le filtre laissé par la session precedente.
  const monthInput = document.getElementById("mercerie-month");
  if (monthInput) monthInput.value = todayIso().slice(0, 7);
  const shopFilter = document.getElementById("mercerie-shop-filter");
  if (shopFilter) shopFilter.value = "";
  showApp();
  renderCatalog();
  resetSaleForm();
  await loadHistory();
}

async function submitLogin(event) {
  event.preventDefault();
  const input = document.getElementById("mercerie-password");
  const password = input?.value.trim() || "";
  if (!password) {
    setFeedback("mercerie-login-feedback", "Entrez le mot de passe.", true);
    return;
  }

  setFeedback("mercerie-login-feedback", "Vérification...");
  const result = await api("login", { password });
  if (!result.ok) {
    setFeedback("mercerie-login-feedback", result.error, true);
    return;
  }

  setToken(result.data.token);
  if (input) input.value = "";
  setFeedback("mercerie-login-feedback", "");
  await startSession(result.data);
}

async function restoreSession() {
  if (!getToken()) {
    showLogin();
    return;
  }
  const result = await api("session");
  if (!result.ok) {
    setToken("");
    showLogin(result.status === 401 ? "" : result.error, result.status !== 401);
    return;
  }
  await startSession(result.data);
}

document.addEventListener("DOMContentLoaded", () => {
  const monthInput = document.getElementById("mercerie-month");
  if (monthInput) {
    monthInput.value = todayIso().slice(0, 7);
    monthInput.addEventListener("change", loadHistory);
  }
  document.getElementById("mercerie-sold-on")?.setAttribute("max", todayIso());
  document.getElementById("mercerie-login-form")?.addEventListener("submit", submitLogin);
  document.getElementById("mercerie-sale-form")?.addEventListener("submit", submitSale);
  document.getElementById("mercerie-reset")?.addEventListener("click", resetSaleForm);
  document.getElementById("mercerie-logout")?.addEventListener("click", logout);
  document.getElementById("mercerie-reload")?.addEventListener("click", loadHistory);
  document.getElementById("mercerie-shop-filter")?.addEventListener("change", loadHistory);

  document.getElementById("mercerie-catalog")?.addEventListener("click", (event) => {
    const line = event.target.closest(".merc-line");
    if (!line) return;
    if (event.target.classList.contains("merc-plus")) bumpQuantity(line, 1);
    if (event.target.classList.contains("merc-minus")) bumpQuantity(line, -1);
  });
  document.getElementById("mercerie-catalog")?.addEventListener("input", refreshFormTotal);

  document.getElementById("mercerie-rows")?.addEventListener("click", (event) => {
    const button = event.target.closest(".merc-row-delete");
    if (button) deleteRow(button.dataset.id);
  });

  restoreSession();
});
