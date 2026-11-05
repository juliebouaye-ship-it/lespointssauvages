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
        { src: "./images/covers/accessoire-oreilles-chat.jpg" },
        { src: "./images/covers/embroidery-petit-chat.jpg" },
        { src: "./images/covers/accessoire-stand-triangle.jpg", position: "center 40%" },
      ],
      title: "Les motifs de l'atelier",
      icon: "🎨",
      intro: "Des motifs originaux, introuvables ailleurs. De nouveaux arrivent régulièrement.",
      products: ["chat"],
    },
    {
      id: "noel",
      title: "Noël",
      icon: "🎄",
      intro: "Des minis pour le sapin et des moyens à glisser dessous.",
      status: "soon",
      products: [],
      soonText: "La collection arrive très bientôt.",
      soonCta: "Être prévenu·e",
      soonPrefill: "Bonjour, j'aimerais être prévenu·e quand la collection Noël sera disponible.",
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
