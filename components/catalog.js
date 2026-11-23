/* ═══════════════════════════════════════════════
   Catalogue de la boutique — LE fichier à modifier pour la boutique.

   • Ajouter un produit : une entrée dans `products`, puis son id dans la
     liste `products` de sa collection.
   • Ajouter une couleur : une ligne dans LPS_COLOR_SWATCHES (nom + teinte).
   • Les PRIX ne sont pas ici : ils sont uniquement dans Supabase
     (table price_rules, scope 'site' / scope_id 'default') :
       product.<id>.kit / product.<id>.fini  → broderies
       accessory.<id>                        → accessoires
     Un produit sans prix dans Supabase s'affiche « Prix bientôt disponible »
     et ne peut pas être commandé.
   • Couleurs des accessoires : la liste commune LPS_ACCESSORY_COLORS
     s'applique à tous, sauf si un accessoire précise sa propre liste `colors`.
   • status : "available" (en vente) ou "soon" (bientôt, pas encore en vente).
   • hoopColors (optionnel) : couleurs de cercle proposées à la commande
     (ex. ["Rouge", "Doré"], ou "all" pour toutes les couleurs de bobines).
   • offerBundle (collection, optionnel) : met l'offre groupée en avant
     dans la collection et sur sa vignette.
   • bundle (optionnel) : offre groupée (voir LPS_CATALOG.bundles), prix de
     l'offre dans Supabase : bundle.<id>.
   • thumb (optionnel) : miniature 800×600 de la carte produit, dans
     images/thumbs/ (réduite proprement : nette, sans effet « rayé »).
   • cover : photos de la vignette de collection (1 à 4, la 1re en grand).
     Utiliser les miniatures de images/covers/ (réduites proprement : évite
     l'effet « rayé » sur le tissu et charge plus vite).
     `position` règle le cadrage si le produit n'est pas au centre
     (ex. "center 80%" = vers le bas). Sans cover : photos des produits.
   ═══════════════════════════════════════════════ */

const LPS_COLOR_SWATCHES = {
  Rouge: "#b3261e",
  Marron: "#7a4a2b",
  "Vert clair": "#a5cf6e",
  Noir: "#222222",
  Blanc: "#ffffff",
  Doré: "#c9a227",
  Argenté: "#c4c7cc",
};

/* Bobines disponibles : ajouter une couleur ici l'ajoute à tous les accessoires */
const LPS_ACCESSORY_COLORS = Object.keys(LPS_COLOR_SWATCHES);

const LPS_CATALOG = {
  /* Offres groupées : X articles du même groupe, au choix, pour un prix fixe
     (prix dans Supabase : bundle.<id>). */
  bundles: {
    minis: { size: 3, label: "Offre 3 minis", hint: "3 minis au choix" },
  },

  collections: [
    {
      id: "mots-piquants",
      cover: [
        { src: "./images/covers/grand-mot-fleur-01.jpg" },
        { src: "./images/covers/embroidery-petit-mot.jpg" },
        { src: "./images/covers/embroidery-grand-mot.jpg" },
      ],
      title: "Les mots piquants",
      icon: "✂️",
      intro: "Petit coup de gueule élégant.",
      products: ["petit", "grand"],
      footnote:
        "Les kits DIY incluent une fiche tuto, le tissu imprimé avec le motif, le cercle à broder, assez de fil et une aiguille.",
    },
    {
      id: "motifs-atelier",
      cover: [
        { src: "./images/covers/atelier-freddie.jpg" },
        { src: "./images/covers/atelier-fille-cheveux.jpg" },
        { src: "./images/covers/accessoire-oreilles-chat.jpg" },
        { src: "./images/covers/embroidery-petit-chat.jpg" },
      ],
      title: "Les motifs de l'atelier",
      icon: "🎨",
      intro: "Des motifs originaux, introuvables ailleurs. De nouveaux arrivent régulièrement.",
      products: ["fille-cheveux", "freddie", "chat"],
    },
    {
      id: "noel",
      title: "Noël",
      icon: "🎄",
      intro: "Des minis pour le sapin et des moyens à glisser dessous.",
      cover: [
        { src: "./images/covers/noel-couronne.jpg" },
        { src: "./images/covers/noel-mini-sapin.jpg" },
        { src: "./images/covers/noel-mini-houx.jpg" },
        { src: "./images/covers/noel-chocolat-chaud.jpg" },
      ],
      products: ["noel-couronne", "noel-chocolat", "noel-sapin", "noel-flocon", "noel-houx"],
      offerBundle: "minis",
    },
    {
      id: "accessoires",
      cover: [
        { src: "./images/covers/accessoire-oreilles-detail.jpg" },
        { src: "./images/covers/stand-derriere.jpg", position: "0% 100%" },
        { src: "./images/covers/chat-cercle-noir.jpg" },
      ],
      title: "Accessoires PLA",
      icon: "🧵",
      intro: "Cercles à broder et supports imprimés à l'atelier en PLA, plusieurs couleurs disponibles.",
      products: ["cercle-couleur", "oreilles-chat", "stand-triangle"],
      showPlaNote: true,
    },
  ],

  products: {
    /* ── Broderies (commande via la fenêtre « Commander ») ── */
    petit: {
      type: "broderie",
      label: "Petit mot",
      tag: { icon: "⭐", text: "Bestseller" },
      image: "./images/embroidery-petit-mot.jpg",
      imageAlt: "Broderie petit mot",
      gallery: [
        { src: "./images/embroidery-petit-mot.jpg", alt: "Petit mot", rotation: 0 },
        { src: "./images/produit-02.jpg", alt: "Contenu du kit Petit mot : tuto, tissu imprimé, cercle et fils", rotation: 0 },
      ],
      description:
        "Un classique plein de caractère. Petit format, grand impact. Disponible en kit DIY ou en broderie finie.",
      diameterCm: 10,
      delays: "kit 48 h ouvrées · broderie finie 5 à 8 jours",
      formats: ["kit", "fini"],
      phrases: ["Ba super", "Zut alors", "Tant pis"],
    },
    grand: {
      type: "broderie",
      label: "Grand mot",
      tag: { icon: "🙃", text: "Passif-brodé-agressif" },
      image: "./images/embroidery-grand-mot.jpg",
      imageAlt: "Broderie grand mot",
      gallery: [
        { src: "./images/embroidery-grand-mot.jpg", alt: "Grand mot", rotation: 0 },
        { src: "./images/grand-mot-fleur-01.jpg", alt: "Grand mot fleuri", rotation: 0 },
      ],
      description: "Pour tout ce qu'on n'ose pas dire en réunion. Grand format, petite politesse.",
      diameterCm: 16,
      delays: "kit 48 h ouvrées · broderie finie 5 à 8 jours",
      formats: ["kit", "fini"],
      phrases: ["Sauf erreur de ma part", "Pas là pour plaire"],
    },
    chat: {
      type: "broderie",
      label: "Petit chat qui dort",
      tag: { icon: "🎨", text: "Personnalisable", special: true },
      image: "./images/embroidery-petit-chat.jpg",
      imageAlt: "Broderie petit chat personnalisable",
      gallery: [
        { src: "./images/embroidery-petit-chat.jpg", alt: "Petit chat qui dort", rotation: 0 },
        { src: "./images/accessoire-stand-triangle.jpg", alt: "Petit chat roux brodé dans un cercle oreilles de chat blanc", rotation: 0 },
        { src: "./images/accessoire-oreilles-chat.jpg", alt: "Quatre petits chats brodés, fourrures et cercles de couleurs différentes", rotation: 0 },
      ],
      description: "Votre chat, votre style : prénom et couleurs de fourrure personnalisables.",
      diameterCm: 14,
      delays: "kit 3 à 5 jours · broderie finie 7 à 12 jours",
      formats: ["kit", "fini"],
    },

    "fille-cheveux": {
      type: "broderie",
      label: "La fille aux cheveux",
      tag: { icon: "📦", text: "Motif d'une ancienne box" },
      image: "./images/hero-photo.jpg",
      thumb: "./images/thumbs/atelier-fille-cheveux.jpg",
      imageAlt: "Broderie d'une silhouette en robe bleue au vent, grand chapeau roux et longs cheveux dorés en fils libres",
      gallery: [{ src: "./images/hero-photo.jpg", alt: "La fille aux cheveux, broderie", rotation: 0 }],
      description: "Robe au vent, grand chapeau et cheveux dorés en fils libres : une silhouette pleine de mouvement.",
      formats: ["kit", "fini"],
    },
    freddie: {
      type: "broderie",
      label: "Freddie",
      tag: { icon: "🎤", text: "Grand format ovale" },
      image: "./images/atelier-freddie.jpg",
      thumb: "./images/thumbs/atelier-freddie.jpg",
      imageAlt: "Broderie sur cercle ovale : chanteur poing levé en veste jaune, avec une liste de souhaits brodée « I want… »",
      gallery: [{ src: "./images/atelier-freddie.jpg", alt: "Freddie, broderie sur cercle ovale", rotation: 0 }],
      description: "Poing levé, veste jaune et une liste de souhaits bien cochée : pour celles et ceux qui veulent tout. Grand format, sur cercle ovale.",
      formats: ["kit", "fini"],
    },

    /* ── Noël ── */
    "noel-sapin": {
      type: "broderie",
      label: "Mini sapin doré",
      tag: { icon: "🎄", text: "Mini" },
      image: "./images/noel-mini-sapin.jpg",
      thumb: "./images/thumbs/noel-mini-sapin.jpg",
      imageAlt: "Mini sapin brodé au fil doré sur tissu bleu nuit, dans un cercle rouge",
      gallery: [{ src: "./images/noel-mini-sapin.jpg", alt: "Mini sapin doré", rotation: 0 }],
      description: "Un sapin brodé au fil doré sur tissu bleu nuit, dans son cercle rouge ou doré, prêt à suspendre au sapin.",
      formats: ["fini"],
      diameterCm: 8,
      bundle: "minis",
      hoopColors: ["Rouge", "Doré"],
    },
    "noel-flocon": {
      type: "broderie",
      label: "Mini flocon",
      tag: { icon: "❄️", text: "Mini" },
      image: "./images/noel-mini-flocon.jpg",
      thumb: "./images/thumbs/noel-mini-flocon.jpg",
      imageAlt: "Mini flocon brodé en blanc sur tissu bleu nuit, dans un cercle rouge",
      gallery: [{ src: "./images/noel-mini-flocon.jpg", alt: "Mini flocon", rotation: 0 }],
      description: "Un flocon brodé sur tissu bleu nuit, dans son cercle rouge ou doré, prêt à suspendre au sapin.",
      formats: ["fini"],
      diameterCm: 8,
      bundle: "minis",
      hoopColors: ["Rouge", "Doré"],
    },
    "noel-houx": {
      type: "broderie",
      label: "Mini houx",
      tag: { icon: "🍃", text: "Mini" },
      image: "./images/noel-mini-houx.jpg",
      thumb: "./images/thumbs/noel-mini-houx.jpg",
      imageAlt: "Mini brin de houx brodé en vert avec trois baies rouges, sur toile écrue, dans un cercle rouge",
      gallery: [{ src: "./images/noel-mini-houx.jpg", alt: "Mini houx", rotation: 0 }],
      description: "Un brin de houx et ses trois baies rouges sur toile écrue, dans son cercle rouge ou doré, prêt à suspendre au sapin.",
      formats: ["fini"],
      diameterCm: 8,
      bundle: "minis",
      hoopColors: ["Rouge", "Doré"],
    },
    "noel-couronne": {
      type: "broderie",
      label: "Couronne de Noël",
      tag: { icon: "🎀", text: "Coup de cœur" },
      image: "./images/noel-couronne.jpg",
      thumb: "./images/thumbs/noel-couronne.jpg",
      imageAlt: "Couronne de sapin brodée avec baies rouges, pommes de pin et grand nœud rouge, dans un cercle rouge",
      gallery: [{ src: "./images/noel-couronne.jpg", alt: "Couronne de Noël brodée", rotation: 0 }],
      description: "Branches de sapin, baies rouges, pommes de pin et un grand nœud : la couronne de Noël à accrocher au mur ou à la porte.",
      formats: ["kit", "fini"],
      diameterCm: 15,
    },
    "noel-chocolat": {
      type: "broderie",
      label: "Chocolat chaud",
      tag: { icon: "🌱", text: "Idéal pour débuter", special: true },
      image: "./images/noel-chocolat-chaud.jpg",
      thumb: "./images/thumbs/noel-chocolat-chaud.jpg",
      imageAlt: "Tasse de chocolat chaud et chantilly brodée, flocon bleu, dans un cercle blanc",
      gallery: [{ src: "./images/noel-chocolat-chaud.jpg", alt: "Chocolat chaud brodé", rotation: 0 }],
      description: "Un motif tout doux et facile à broder : parfait pour une première broderie, ou à offrir à quelqu'un qui veut se lancer.",
      formats: ["kit", "fini"],
      diameterCm: 12.5,
    },

    /* ── Accessoires (ajout direct au panier) ── */
    "cercle-couleur": {
      type: "accessoire",
      label: "Cercle à broder de couleur",
      cartLabel: "Cercle à broder couleur (PLA)",
      icon: "⭕",
      sizes: ["10 cm", "14 cm", "16 cm"],
      description: "Le cercle à broder dans la couleur de votre choix, aux tailles des kits.",
      customSizeHint: true,
      delays: "48 h ouvrées",
    },
    "oreilles-chat": {
      type: "accessoire",
      label: "Cercle à broder oreilles de chat",
      cartLabel: "Cercle oreilles de chat (PLA)",
      icon: "🐾",
      description: "Un cercle à broder avec deux petites oreilles de chat.",
      gallery: [
        { src: "./images/accessoire-oreilles-detail.jpg", alt: "Cercle oreilles de chat, détail", rotation: 0 },
        { src: "./images/chat-cercle-noir.jpg", alt: "Cercle oreilles de chat noir", rotation: 0 },
      ],
      delays: "48 h ouvrées",
    },
    "stand-triangle": {
      type: "accessoire",
      label: "Stand triangle pour poser les broderies",
      cartLabel: "Stand triangle (PLA)",
      icon: "🔺",
      description: "Support discret pour exposer vos broderies debout.",
      gallery: [
        { src: "./images/stand-derriere.jpg", alt: "Stand triangle, vue de dos", rotation: 0 },
      ],
      delays: "48 h ouvrées",
    },
  },
};

if (typeof window !== "undefined") {
  window.LPS_CATALOG = LPS_CATALOG;
  window.LPS_ACCESSORY_COLORS = LPS_ACCESSORY_COLORS;
  window.LPS_COLOR_SWATCHES = LPS_COLOR_SWATCHES;
}
