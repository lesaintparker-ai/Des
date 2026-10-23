// Identité visuelle validée (d'après l'affiche officielle).
export const COLORS = {
	noir: '#0E0507',
	bordeauxNuit: '#2A070C',
	bordeaux: '#4A0E14',
	rouge: '#C1121F',
	rougeVif: '#E0252F',
	or: '#E3A72F',
	orClair: '#F6CF6B',
	blanc: '#FFFFFF',
	creme: '#FFF4E0',
} as const;

export const FONTS = {
	titre: "'Anton', 'Impact', sans-serif",
	texte: "'Montserrat', 'Arial', sans-serif",
} as const;

export const VIDEO = {
	width: 1080,
	height: 1920,
	fps: 30,
} as const;

// Zone de sécurité Reels / TikTok : rien d'important sous cette limite.
export const SAFE_BOTTOM = 1620;
