/* ═══════════════════════════════════════════════
   Affichage de la boutique à partir de components/catalog.js.
   Rien à modifier ici pour ajouter un produit : tout se passe dans catalog.js.
   Ce script s'exécute avant script.js : les boutons générés sont donc
   branchés (panier, galerie, commande) comme s'ils étaient écrits en HTML.
   ═══════════════════════════════════════════════ */

(function renderCatalog() {
  const root = document.getElementById("boutique-collections");
  if (!root || typeof LPS_CATALOG === "undefined") return;

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
  const slug = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  function galleryButton(product, className, label) {
    const items = product.gallery || [];
    if (!items.length) return "";
    return `<button
      type="button"
      class="${className}"
      data-open-gallery
      data-gallery-title="${esc(product.label)}"
      data-gallery-images="${esc(items.map((i) => i.src).join("|"))}"
      data-gallery-alts="${esc(items.map((i) => i.alt).join("|"))}"
      data-gallery-rotations="${esc(items.map((i) => i.rotation || 0).join("|"))}"
    >${label}</button>`;
  }

  function broderieCard(id, p) {
    const tag = p.tag
      ? `<div class="card-tag${p.tag.special ? " card-tag--special" : ""}"><span aria-hidden="true">${esc(p.tag.icon)}</span> ${esc(p.tag.text)}</div>`
      : "";
    const from = Math.min(...Object.values(p.prices || {}).map(Number));
    const thumb = p.image
      ? `<div class="card-thumb-wrap">
          <img class="card-thumb" src="${esc(p.image)}" alt="${esc(p.imageAlt || p.label)}" loading="lazy" decoding="async" />
          ${galleryButton(p, "card-photo-btn", "🖼️ Voir les photos")}
        </div>`
      : `<div class="card-thumb-wrap card-thumb-wrap--empty" aria-hidden="true"><span>📷 Photo à venir</span></div>`;
    const info = [p.diameterCm ? `Diamètre : ${p.diameterCm} cm` : "", p.delays ? `Expédition estimée : ${p.delays}` : ""]
      .filter(Boolean)
      .join(" · ");
    const formats = Object.keys(p.prices || {});
    const buttons = [
      formats.includes("kit")
        ? `<button type="button" class="btn btn-primary" data-open-order="${esc(id)}" data-order-format="kit"><span class="btn-icon" aria-hidden="true">🧵</span> Kit DIY</button>`
        : "",
      formats.includes("fini")
        ? `<button type="button" class="btn btn-outline" data-open-order="${esc(id)}" data-order-format="fini"><span class="btn-icon" aria-hidden="true">🖼️</span> Broderie finie</button>`
        : "",
    ].join("");
    return `<article class="card reveal" role="listitem">
      ${tag}
      ${thumb}
      <h3>${esc(p.label)}</h3>
      <p class="product-desc">${esc(p.description)}</p>
      ${Number.isFinite(from) ? `<p class="meta" data-price-product="${esc(id)}">À partir de : ${euro(from)}</p>` : ""}
      ${info ? `<p class="micro-info">${esc(info)}.</p>` : ""}
      <div class="format-toggle" role="group" aria-label="Choisir le format pour ${esc(p.label)}">${buttons}</div>
    </article>`;
  }

  function accessoryCard(id, p) {
    const swatches = LPS_COLOR_SWATCHES || {};
    const colors = (p.colors || []).map((color, i) => {
      const inputId = `accessory-${id}-color-${slug(color)}`;
      return `<input class="swatch-input" type="radio" name="accessory-color-${esc(id)}" id="${esc(inputId)}" value="${esc(color)}"${i === 0 ? " checked" : ""} />
        <label class="swatch-label" for="${esc(inputId)}"><span class="swatch-dot" style="--swatch:${esc(swatches[color] || "#ccc")}" aria-hidden="true"></span>${esc(color)}</label>`;
    });
    const sizes = (p.sizes || []).map((size, i) => {
      const inputId = `accessory-${id}-size-${slug(size)}`;
      return `<input class="pill-toggle-input" type="radio" name="accessory-size-${esc(id)}" id="${esc(inputId)}" value="${esc(size)}"${i === 0 ? " checked" : ""} />
        <label class="pill-toggle-label" for="${esc(inputId)}">${esc(size)}</label>`;
    });
    return `<article class="card reveal" role="listitem">
      <h3><span aria-hidden="true">${esc(p.icon || "")}</span> ${esc(p.label)}</h3>
      <div class="accessory-meta-row">
        <p class="meta" data-price-accessory="${esc(id)}">${euro(p.price)} · PLA biosourcé</p>
        ${galleryButton(p, "accessory-photo-link", "🖼️ Voir les photos")}
      </div>
      <p>${esc(p.description)}</p>
      ${p.delays ? `<p class="micro-info">Expédition estimée : ${esc(p.delays)}.</p>` : ""}
      <div class="accessory-controls">
        ${colors.length ? `<div class="swatch-group" role="radiogroup" aria-label="Couleur — ${esc(p.label)}">${colors.join("")}</div>` : ""}
        ${sizes.length ? `<div class="pill-toggle pill-toggle--compact" role="radiogroup" aria-label="Taille — ${esc(p.label)}">${sizes.join("")}</div>` : ""}
        <div class="accessory-inline-row">
          <div class="qty-stepper">
            <button type="button" class="qty-step-btn" data-qty-step="-1" aria-label="Diminuer la quantité">-</button>
            <input class="accessory-qty" type="number" min="1" value="1" aria-label="Quantité — ${esc(p.label)}" />
            <button type="button" class="qty-step-btn" data-qty-step="1" aria-label="Augmenter la quantité">+</button>
          </div>
          <button class="btn btn-outline" type="button" data-add-accessory-card="${esc(id)}">Ajouter au panier</button>
        </div>
        ${
          p.customSizeHint
            ? `<p class="micro-info">Autre taille ? <button type="button" class="btn-text-link-inline" data-open-custom-request data-custom-request-title="Demander une autre taille" data-custom-request-prefill="${esc(`Bonjour, je souhaiterais un ${p.label.toLowerCase()} de … cm, couleur …`)}">Demandez-moi</button></p>`
            : ""
        }
      </div>
    </article>`;
  }

  function soonCard(collection) {
    return `<article class="card card--soon reveal" role="listitem">
      <div class="card-tag card-tag--special">Bientôt</div>
      <p class="card-soon-icon" aria-hidden="true">${esc(collection.icon)}</p>
      <p class="product-desc">${esc(collection.soonText || "Bientôt disponible.")}</p>
      ${
        collection.soonCta
          ? `<button type="button" class="btn btn-outline" data-open-custom-request data-custom-request-title="${esc(collection.soonCta)}" data-custom-request-prefill="${esc(collection.soonPrefill || "")}">${esc(collection.soonCta)}</button>`
          : ""
      }
    </article>`;
  }

  const plaNote = `<div class="accessory-note reveal">
      <h3>Imprimés localement en PLA biosourcé</h3>
      <p>
        Le PLA est un plastique d'origine végétale (souvent à base d'amidon de maïs), plus léger côté impact.
        Chaque accessoire est imprimé en local pour garder une production artisanale.
      </p>
      <p>
        <strong>Durabilité :</strong> usage normal, solide pour l'exposition.
        <strong>Chaleur :</strong> éviter les fortes températures prolongées (voiture en plein soleil).
        <strong>Entretien :</strong> chiffon doux sec ou légèrement humide, sans solvants.
      </p>
    </div>`;

  const products = LPS_CATALOG.products || {};
  const collections = LPS_CATALOG.collections || [];

  const nav = `<nav class="collection-nav reveal" aria-label="Collections">
    ${collections
      .map(
        (c) =>
          `<a class="collection-chip" href="#collection-${esc(c.id)}"><span aria-hidden="true">${esc(c.icon)}</span> ${esc(c.title)}${
            c.status === "soon" ? ' <span class="collection-chip-badge">bientôt</span>' : ""
          }</a>`
      )
      .join("")}
  </nav>`;

  const sections = collections.map((c) => {
    const cards = (c.products || [])
      .map((id) => {
        const p = products[id];
        if (!p) return "";
        return p.type === "accessoire" ? accessoryCard(id, p) : broderieCard(id, p);
      })
      .filter(Boolean);
    if (!cards.length || c.status === "soon") cards.push(soonCard(c));
    return `<section class="collection" id="collection-${esc(c.id)}" aria-labelledby="collection-title-${esc(c.id)}">
      <div class="collection-head reveal">
        <h3 class="collection-title" id="collection-title-${esc(c.id)}"><span aria-hidden="true">${esc(c.icon)}</span> ${esc(c.title)}</h3>
        ${c.intro ? `<p class="collection-intro">${esc(c.intro)}</p>` : ""}
      </div>
      <div class="cards cards-3" role="list">${cards.join("")}</div>
      ${c.footnote ? `<p class="accessory-note reveal">${esc(c.footnote)}</p>` : ""}
      ${c.showPlaNote ? plaNote : ""}
    </section>`;
  });

  root.innerHTML = nav + sections.join("");

  /* Liste des broderies dans la fenêtre « Commander » */
  const select = document.getElementById("order-product");
  if (select) {
    select.innerHTML =
      '<option value="">Choisir</option>' +
      Object.entries(products)
        .filter(([, p]) => p.type === "broderie")
        .map(([id, p]) => `<option value="${esc(id)}">${esc(p.label)}</option>`)
        .join("");
  }
})();
