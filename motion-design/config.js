// ─────────────────────────────────────────────────────────────
//  CONFIGURATION DU MOTION DESIGN — SUURA
//  Modifiez ce fichier pour changer textes, couleurs, prix, numéros…
//  Format : vertical 1080 x 1920 (TikTok, Reels, Statut WhatsApp)
// ─────────────────────────────────────────────────────────────
window.MD_CONFIG = {
  fps: 30,
  width: 1080,
  height: 1920,

  brand: {
    name: "Suura",
    // Mettez ici votre vrai logo (ex : "assets/logo.svg") ; null = logo redessiné
    logo: null,
    tagline: "La solution qui vous connecte.",
    url: "suura.app",
    cta: "Écris « Bonjour Suura »",
    ctaSub: "sur WhatsApp ou Telegram",
  },

  colors: {
    bgCenter: "#0d6a4e",
    bgEdge: "#021f16",
    accent: "#1f9a6e",
    accentDark: "#0b5a45",
    gold: "#f5c518",
    card: "#f0f8f2",
    ink: "#0b2e22",
    danger: "#ff5a4f",
  },

  persona: {
    name: "Awa",
    role: "Abidjan · en pleine discussion",
    avatar: null, // chemin d'une image, ou null pour l'illustration
  },

  hook: {
    alertTitle: "Crédit épuisé",
    alertText: "Solde : 0 F · Internet : 0 Mo",
    question: ["Plus de crédit", "en pleine discussion ?"],
  },

  promise: {
    // *texte* = mis en valeur (jaune + soulignement animé)
    lines: ["Recharge ton", "crédit en", "*30 secondes*,", "et continue ta", "discussion."],
    available: "Disponible sur WhatsApp & Telegram",
  },

  networks: [
    { name: "Orange", color: "#ff7900" },
    { name: "MTN", color: "#ffcb05" },
    { name: "Moov", color: "#0a8fd6" },
  ],

  // Conversation WhatsApp (reprise du vrai parcours Suura)
  chat: {
    number: "0718805326",
    operator: "Orange CI",
    pass: "Pass Internet 500F",
    passDetail: "1.5 Go · 3 jours",
    price: 500,
    fees: 35,
    duration: 28, // secondes affichées sur le chrono
  },

  payMethods: [
    { name: "Wave", color: "#1dc8f2" },
    { name: "Orange Money", color: "#ff7900" },
    { name: "Djamo", color: "#111111" },
    { name: "Moov Money", color: "#0a8fd6" },
    { name: "MTN MoMo", color: "#ffcb05" },
  ],
  chosenPay: 0,

  steps: ["Dis ce que tu veux", "Paie en toute simplicité", "Le crédit arrive"],

  confirm: { title: "Pass activé !", sub: "Livré aussitôt." },

  // « Pourquoi Suura » — visual : instant | networks | momo | proche
  features: [
    { title: "Instantané", sub: "Le crédit part dès que le paiement est confirmé.", hl: "Pas d'attente, pas de file.", visual: "instant" },
    { title: "Tous les réseaux", sub: "Orange, MTN et Moov.", hl: "Un seul endroit pour tout.", visual: "networks" },
    { title: "Paiement mobile money", sub: "Paie avec ce que tu utilises déjà,", hl: "sans carte bancaire.", visual: "momo" },
    { title: "Recharge pour un proche", sub: "Famille au village, amis au pays :", hl: "envoie-leur du crédit.", visual: "proche" },
  ],
  featuresLabel: "Pourquoi Suura",

  proche: { name: "Maman", city: "Bouaké", amount: "1 000 F" },

  stats: [
    { value: "3", label: "réseaux couverts" },
    { value: "24/7", label: "disponible à toute heure" },
    { value: "2", label: "messageries : WhatsApp & Telegram" },
  ],
};
