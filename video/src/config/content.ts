// Tous les textes affichés, prix, contacts et la chronologie de la vidéo.
// Les temps sont en secondes sur la vidéo finale.

export const BRAND = "BRUNCH ENTRE'AMIS";

export const EVENT = {
	jour: 'SAMEDI',
	date: '31',
	mois: 'OCTOBRE',
	annee: '2026',
	lieu: 'AKEKOI VILLAGE',
	precision: 'Terrain de football',
};

export const CONTACTS = ['+225 07 47 54 11 98', '+225 07 67 03 95 24', '+225 07 78 16 21 76'];

export type Price = {prefix?: string; amount: string};

const FCFA = (amount: string, prefix?: string): Price => ({amount, prefix});

// Décalage de la voix off dans la vidéo.
export const VO_OFFSET = 0.4;
// Convertit un temps du fichier de voix off en temps vidéo.
const vo = (s: number) => +(s + VO_OFFSET).toFixed(2);

export const DURATION_S = 78;

const SUB = 'substitution';

export const PORC = [
	{
		name: 'CHOUKOUYA',
		price: FCFA('2 000', 'À partir de'),
		photo: `${SUB}/porc-au-four/choukouya_photo-plaque-four-oignons.jpg`,
		start: vo(10.9),
		end: vo(13.6),
	},
	{
		name: 'SAUTÉ-REVENIR',
		price: FCFA('2 000', 'À partir de'),
		photo: `${SUB}/porc-au-four/saute-revenir_photo-plat-oignons-poivrons.jpg`,
		extra: `${SUB}/porc-au-four/saute-revenir_photo-barquette-pimentee.jpg`,
		start: vo(13.6),
		end: vo(16.97),
	},
];

export const VOLAILLES = [
	{
		name: 'DEMI POULET',
		price: FCFA('3 500', 'À partir de'),
		photo: `${SUB}/volailles/demi-poulet_photo-deux-demis-planche.jpg`,
		start: vo(21.54),
		end: vo(24.34),
	},
	{
		name: '1 POULET DE CHAIR',
		price: FCFA('5 000'),
		photo: `${SUB}/volailles/poulet-de-chair_photo-cuisses-poele-fonte.jpg`,
		start: vo(24.34),
		end: vo(26.93),
	},
	{
		name: '1 POULET PONDEUSE',
		price: FCFA('6 000'),
		photo: `${SUB}/volailles/poulet-pondeuse_photo-barquette-morceaux.jpg`,
		// Recadrage sous le logo de la cuisinière visible en haut de l'image.
		objectPosition: '50% 80%',
		start: vo(26.93),
		end: vo(29.49),
	},
	{
		name: '1 POULET AFRICAIN',
		price: FCFA('7 000'),
		photo: `${SUB}/volailles/poulet-africain_photo-entier-ouvert-grille.jpg`,
		extra: `${SUB}/volailles/poulet-africain_photo-grille-braise-morceaux.jpg`,
		start: vo(29.49),
		end: vo(32.09),
	},
	{
		name: '1 PINTADE',
		price: FCFA('8 500'),
		photo: `${SUB}/volailles/pintade_photo-entiere-carottes-pommes-de-terre.jpg`,
		objectPosition: '42% 50%',
		extra: `${SUB}/volailles/pintade_photo-plateau-sauces.jpg`,
		start: vo(32.09),
		end: vo(34.86),
	},
];

export const ACCOMPAGNEMENTS = [
	{name: 'Attiéké', photo: `${SUB}/accompagnements/attieke_photo-assiette-rayee-gros-plan.jpg`, at: vo(36.32)},
	{name: 'Frites', photo: 'prepare/frites_detoure.png', cutout: true, at: vo(37.32)},
	{name: 'Pain', photo: 'prepare/pain_detoure.png', cutout: true, at: vo(38.01)},
];

const B = `${SUB}/boissons`;

// Images des boissons : fichiers originaux, utilisés tels quels (décision client).
export type DrinkLayout = 'single' | 'row' | 'stack' | 'feature' | 'video';

export const BOISSONS: {
	name: string;
	price: Price;
	images: string[];
	video?: string;
	layout: DrinkLayout;
	start: number;
	end: number;
}[] = [
	{name: 'BIÈRE BOCK 66', price: FCFA('600'), images: [`${B}/bock_photo-gamme-fond-vert.jpg`], layout: 'single', start: vo(41.17), end: vo(43.77)},
	{
		name: 'BIÈRE CASTEL',
		price: FCFA('600'),
		images: [`${B}/castel_photo-bouteille.jpg`, `${B}/castel_logo.png`],
		layout: 'row',
		start: vo(43.77),
		end: vo(45.97),
	},
	{
		name: 'BIÈRE BEAUFORT',
		price: FCFA('700'),
		images: [`${B}/beaufort_photo-bouteille-fond-gris.jpg`, `${B}/beaufort_photo-main-deux-bouteilles.jpg`, `${B}/beaufort_photo-canette.png`],
		layout: 'feature',
		start: vo(45.97),
		end: vo(48.27),
	},
	{
		name: 'KIT DESPERADOS (03)',
		price: FCFA('2 000'),
		video: `${B}/desperados_video-bouteille-main-toit-crepuscule.mp4`,
		images: [`${B}/desperados_photo-seau-glace-bois.jpg`, `${B}/desperados_photo-bouteille-fond-bleu.jpg`],
		layout: 'video',
		start: vo(48.27),
		end: vo(51.75),
	},
	{
		name: 'VIN VALPIERE KIRAVI',
		price: FCFA('2 500'),
		images: [`${B}/valpierre_photo-bouteille-et-casier.webp`, `${B}/valpierre_photo-bouteille-seule.jpg`],
		layout: 'row',
		start: vo(51.75),
		end: vo(55.06),
	},
	{
		name: 'VIN BOUCHÉ',
		price: FCFA('3 500'),
		images: [
			`${B}/vin-bouche_photo-chateau-vieux-robin.jpg`,
			`${B}/vin-bouche_photo-montresor-corvina.jpg`,
			`${B}/vin-bouche_photo-chateau-latour-2010.jpg`,
		],
		layout: 'row',
		start: vo(55.06),
		end: vo(57.77),
	},
	{
		name: 'SODA',
		price: FCFA('500', 'Tout à'),
		images: [`${B}/soda_photo-sprite-coca-fanta-filigrane-alamy.jpg`, `${B}/soda_photo-gamme-marques-multiples.webp`],
		layout: 'stack',
		start: vo(57.77),
		end: vo(60.69),
	},
];

// Chronologie des scènes (secondes vidéo).
export const T = {
	hook: {start: 0, end: vo(4.01)},
	hookPrets: vo(3.28),
	dateBrand: {start: vo(4.01), end: vo(8.35)},
	dateQuestion: vo(5.5),
	brandSlam: vo(6.7),
	porcLabel: {start: vo(8.35), end: vo(10.9)},
	faim: {start: vo(16.97), end: vo(20.21)},
	volaillesLabel: {start: vo(20.21), end: vo(21.54)},
	accompagnements: {start: vo(34.86), end: vo(38.7)},
	boissonsLabel: {start: vo(38.7), end: vo(41.17)},
	notez: {start: vo(60.69), end: vo(62.13)},
	rdv: {start: vo(62.13), end: vo(66.98)},
	rdvLieu: vo(64.63),
	rdvTerrain: vo(66.01),
	contacts: {start: vo(66.98), end: vo(70.19)},
	final: {start: vo(70.19), end: DURATION_S},
	finalDate: vo(71.52),
	musicEnd: 76,
};

export const AUDIO = {
	voixOff: 'audio/voix-off-client.mp3',
	musique: 'audio/genere/musique-provisoire.mp3',
	sfx: {
		pop: 'audio/genere/sfx-pop.wav',
		whoosh: 'audio/genere/sfx-whoosh.wav',
		impact: 'audio/genere/sfx-impact.wav',
		grille: 'audio/genere/sfx-grille.wav',
		decapsule: 'audio/genere/sfx-decapsule.wav',
		eclat: 'audio/genere/sfx-eclat.wav',
		tic: 'audio/genere/sfx-tic.wav',
	},
};

export const VIDEOS = {
	grilleFumee: `${SUB}/volailles/volailles_video-grille-fumee-braises.mp4`,
	grillRue: `${SUB}/volailles/volailles_video-grill-de-rue-poulets-brochettes.mp4`,
	cuisson: `${SUB}/porc-au-four/cuisson_video-poele-viande-sauce.mp4`,
	desperados: `${B}/desperados_video-bouteille-main-toit-crepuscule.mp4`,
};
