/* ═══════════════════════════════════════════════
   Affichage de la boutique à partir de components/catalog.js.
   Rien à modifier ici pour ajouter un produit : tout se passe dans catalog.js.

   • Accueil boutique : une vignette par collection (mosaïque de photos).
   • Clic sur une vignette : la collection s'affiche à la place, avec sa
     propre adresse (#noel, #accessoires…) → lien partageable, bouton
     « retour » du téléphone, QR code possible vers une collection.
   • Les prix sont remplis ensuite par syncDisplayedPrices() (script.js),
     depuis Supabase.
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
  const slug = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  const products = LPS_CATALOG.products || {};
  const collections = LPS_CATALOG.collections || [];
  const collectionIds = new Set(collections.map((c) => c.id));

  /* ── Cartes produits ─────────────────────────── */

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
    const thumb = p.image
      ? `<div class="card-thumb-wrap">
          <img class="card-thumb" src="${esc(p.image)}" alt="${esc(p.imageAlt || p.label)}" loading="lazy" decoding="async" />
          ${galleryButton(p, "card-photo-btn", "🖼️ Voir les photos")}
        </div>`
      : `<div class="card-thumb-wrap card-thumb-wrap--empty" aria-hidden="true"><span>📷 Photo à venir</span></div>`;
    const info = [p.diameterCm ? `Diamètre : ${p.diameterCm} cm` : "", p.delays ? `Expédition estimée : ${p.delays}` : ""]
      .filter(Boolean)
      .join(" · ");
    const formats = p.formats || ["kit", "fini"];
    const buttons = [
      formats.includes("kit")
        ? `<button type="button" class="btn btn-primary" data-open-order="${esc(id)}" data-order-format="kit"><span class="btn-icon" aria-hidden="true">🧵</span> Kit DIY</button>`
        : "",
      formats.includes("fini")
        ? `<button type="button" class="btn btn-outline" data-open-order="${esc(id)}" data-order-format="fini"><span class="btn-icon" aria-hidden="true">🖼️</span> Broderie finie</button>`
        : "",
    ].join("");
    return `<article class="card" role="listitem">
      ${tag}
      ${thumb}
      <h3>${esc(p.label)}</h3>
      <p class="product-desc">${esc(p.description)}</p>
      <p class="meta" data-price-product="${esc(id)}">…</p>
      ${info ? `<p class="micro-info">${esc(info)}.</p>` : ""}
      <div class="format-toggle" role="group" aria-label="Choisir le format pour ${esc(p.label)}">${buttons}</div>
    </article>`;
  }

  function accessoryCard(id, p) {
    const swatches = typeof LPS_COLOR_SWATCHES !== "undefined" ? LPS_COLOR_SWATCHES : {};
    const colorList = p.colors || (typeof LPS_ACCESSORY_COLORS !== "undefined" ? LPS_ACCESSORY_COLORS : []);
    const colors = colorList.map((color, i) => {
      const inputId = `accessory-${id}-color-${slug(color)}`;
      return `<input class="swatch-input" type="radio" name="accessory-color-${esc(id)}" id="${esc(inputId)}" value="${esc(color)}"${i === 0 ? " checked" : ""} />
        <label class="swatch-label" for="${esc(inputId)}" title="${esc(color)}"><span class="swatch-dot" style="--swatch:${esc(swatches[color] || "#ccc")}" aria-hidden="true"></span><span class="sr-only">${esc(color)}</span></label>`;
    });
    const sizes = (p.sizes || []).map((size, i) => {
      const inputId = `accessory-${id}-size-${slug(size)}`;
      return `<input class="pill-toggle-input" type="radio" name="accessory-size-${esc(id)}" id="${esc(inputId)}" value="${esc(size)}"${i === 0 ? " checked" : ""} />
        <label class="pill-toggle-label" for="${esc(inputId)}">${esc(size)}</label>`;
    });
    return `<article class="card" role="listitem">
      <h3><span aria-hidden="true">${esc(p.icon || "")}</span> ${esc(p.label)}</h3>
      <div class="accessory-meta-row">
        <p class="meta" data-price-accessory="${esc(id)}">…</p>
        ${galleryButton(p, "accessory-photo-link", "🖼️ Voir les photos")}
      </div>
      <p>${esc(p.description)}</p>
      ${p.delays ? `<p class="micro-info">Expédition estimée : ${esc(p.delays)}.</p>` : ""}
      <div class="accessory-controls">
        ${
          colors.length
            ? `<div class="swatch-field">
                <p class="swatch-caption">Couleur : <strong class="swatch-current">${esc(colorList[0])}</strong></p>
                <div class="swatch-group" role="radiogroup" aria-label="Couleur — ${esc(p.label)}">${colors.join("")}</div>
              </div>`
            : ""
        }
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
    return `<article class="card card--soon" role="listitem">
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

  const plaNote = `<div class="accessory-note">
      <h3>Imprimés à l'atelier en PLA biosourcé</h3>
      <p>
        Le PLA est un plastique fabriqué à partir de sucres végétaux. Chaque accessoire est imprimé à l'atelier, à la demande.
        Il craint la chaleur : pas de voiture en plein soleil.
        <a href="./pla.html">Tout savoir sur le PLA (sources à l'appui) →</a>
      </p>
    </div>`;

  /* ── Vignettes de collection (mosaïque de photos) ── */

  function collectionPhotos(c) {
    if (Array.isArray(c.cover) && c.cover.length) return c.cover.slice(0, 4);
    const photos = [];
    (c.products || []).forEach((id) => {
      const p = products[id];
      if (!p) return;
      const first = p.image ? { src: p.image, alt: p.imageAlt || p.label, rotation: 0 } : p.gallery?.[0];
      if (first) photos.push(first);
    });
    /* Compléter avec les autres photos des galeries si la collection a peu de produits */
    (c.products || []).forEach((id) => {
      (products[id]?.gallery || []).forEach((g) => {
        if (photos.length < 4 && !photos.some((ph) => ph.src === g.src)) photos.push(g);
      });
    });
    return photos.slice(0, 4);
  }

  function collectionTile(c) {
    const photos = collectionPhotos(c);
    const count = (c.products || []).filter((id) => products[id]).length;
    const status =
      c.status === "soon" || !count
        ? '<span class="collection-tile-badge">Bientôt</span>'
        : `<span class="collection-tile-count">${count} ${count > 1 ? "articles" : "article"}</span>`;
    const mosaic = photos.length
      ? `<div class="collection-mosaic collection-mosaic--${photos.length}">${photos
          .map(
            (ph) =>
              `<span class="collection-mosaic-cell"><img src="${esc(ph.src)}" alt="" loading="lazy" decoding="async"${
                ph.position ? ` style="object-position:${esc(ph.position)}"` : ""
              } /></span>`
          )
          .join("")}</div>`
      : `<div class="collection-mosaic collection-mosaic--empty"><span aria-hidden="true">${esc(c.icon)}</span></div>`;
    return `<a class="collection-tile" href="#${esc(c.id)}" role="listitem">
      ${mosaic}
      <div class="collection-tile-body">
        <h3 class="collection-tile-title"><span aria-hidden="true">${esc(c.icon)}</span> ${esc(c.title)}</h3>
        ${c.intro ? `<p class="collection-tile-intro">${esc(c.intro)}</p>` : ""}
        <p class="collection-tile-foot">${status}<span class="collection-tile-cta">Voir <span aria-hidden="true">→</span></span></p>
      </div>
    </a>`;
  }

  /* ── Vue d'une collection ────────────────────── */

  function collectionView(c) {
    const cards = (c.products || [])
      .map((id) => {
        const p = products[id];
        if (!p) return "";
        return p.type === "accessoire" ? accessoryCard(id, p) : broderieCard(id, p);
      })
      .filter(Boolean);
    if (!cards.length || c.status === "soon") cards.push(soonCard(c));
    return `<section class="collection" id="collection-${esc(c.id)}" data-collection-view="${esc(c.id)}" aria-labelledby="collection-title-${esc(c.id)}" hidden>
      <a class="collection-back" href="#produits"><span aria-hidden="true">←</span> Toutes les collections</a>
      <div class="collection-head">
        <h3 class="collection-title" id="collection-title-${esc(c.id)}" tabindex="-1"><span aria-hidden="true">${esc(c.icon)}</span> ${esc(c.title)}</h3>
        ${c.intro ? `<p class="collection-intro">${esc(c.intro)}</p>` : ""}
      </div>
      <div class="cards cards-3" role="list">${cards.join("")}</div>
      ${c.footnote ? `<p class="accessory-note">${esc(c.footnote)}</p>` : ""}
      ${c.showPlaNote ? plaNote : ""}
    </section>`;
  }

  root.innerHTML = `
    <div class="collection-grid reveal" data-collection-home role="list" aria-label="Collections">
      ${collections.map(collectionTile).join("")}
    </div>
    ${collections.map(collectionView).join("")}`;

  /* ── Navigation : #id de collection dans l'adresse ── */

  const home = root.querySelector("[data-collection-home]");

  function showFromHash({ scroll } = { scroll: true }) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const active = collectionIds.has(id) ? id : null;
    root.querySelectorAll("[data-collection-view]").forEach((view) => {
      view.hidden = view.getAttribute("data-collection-view") !== active;
    });
    if (home) home.hidden = Boolean(active);
    if (!scroll) return;
    if (active) {
      const title = document.getElementById(`collection-title-${active}`);
      document.getElementById("produits")?.scrollIntoView({ behavior: "smooth", block: "start" });
      title?.focus({ preventScroll: true });
    }
  }

  window.addEventListener("hashchange", () => showFromHash());
  showFromHash({ scroll: Boolean(window.location.hash) });

  /* Nom de la couleur choisie à côté des pastilles */
  root.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.classList?.contains("swatch-input")) return;
    const current = input.closest(".swatch-field")?.querySelector(".swatch-current");
    if (current) current.textContent = input.value;
  });

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
