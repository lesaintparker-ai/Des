import React from 'react';
import {COLORS} from '../config/theme';

// Logo redessiné d'après l'affiche : toque de chef dorée dans un cercle rouge.
export const Logo: React.FC<{size?: number}> = ({size = 260}) => (
	<svg width={size} height={size} viewBox="0 0 200 200">
		<defs>
			<radialGradient id="logoFond" cx="40%" cy="35%" r="70%">
				<stop offset="0%" stopColor={COLORS.rougeVif} />
				<stop offset="100%" stopColor="#7A0A14" />
			</radialGradient>
		</defs>
		<circle cx="100" cy="100" r="94" fill="url(#logoFond)" stroke={COLORS.or} strokeWidth="5" />
		<g fill="none" stroke={COLORS.orClair} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
			<path d="M62 118 C40 112 38 80 62 76 C64 56 92 50 100 64 C110 48 138 56 138 76 C162 80 160 112 138 118" />
			<path d="M64 118 L66 140 L134 140 L136 118" />
			<path d="M70 128 L130 128" />
			<path d="M84 104 L86 118 M100 98 L100 118 M116 104 L114 118" />
		</g>
	</svg>
);

// Illustration graphique de pintade (aucune photo réelle disponible) :
// silhouette dorée au plumage pointillé, clairement stylisée.
export const PintadeIllustration: React.FC<{size?: number}> = ({size = 560}) => {
	const dots: [number, number][] = [];
	for (let r = 0; r < 6; r++) {
		for (let c = 0; c < 9; c++) {
			const x = 92 + c * 17 + (r % 2) * 8;
			const y = 112 + r * 15;
			const dx = (x - 160) / 78;
			const dy = (y - 148) / 50;
			if (dx * dx + dy * dy < 0.85) dots.push([x, y]);
		}
	}
	return (
		<svg width={size} height={size} viewBox="0 0 300 300">
			<defs>
				<radialGradient id="pintadeCorps" cx="45%" cy="40%" r="70%">
					<stop offset="0%" stopColor="#5A1A20" />
					<stop offset="100%" stopColor="#1E0609" />
				</radialGradient>
			</defs>
			<circle cx="150" cy="150" r="140" fill="none" stroke={COLORS.or} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
			{/* corps */}
			<ellipse cx="160" cy="150" rx="82" ry="56" fill="url(#pintadeCorps)" stroke={COLORS.or} strokeWidth="4" />
			{dots.map(([x, y], i) => (
				<circle key={i} cx={x} cy={y} r="3.2" fill={COLORS.creme} opacity={0.9} />
			))}
			{/* cou et tête */}
			<path d="M96 132 C84 112 82 92 88 78" fill="none" stroke={COLORS.or} strokeWidth="9" strokeLinecap="round" />
			<circle cx="90" cy="70" r="13" fill={COLORS.creme} stroke={COLORS.or} strokeWidth="3" />
			<path d="M86 58 L92 44 L97 58 Z" fill={COLORS.or} />
			<path d="M78 72 L66 76 L78 79 Z" fill={COLORS.or} />
			<path d="M86 82 C84 92 92 94 94 84" fill={COLORS.rougeVif} />
			<circle cx="92" cy="68" r="2.5" fill={COLORS.noir} />
			{/* queue et pattes */}
			<path d="M240 140 C258 150 260 168 246 178" fill="none" stroke={COLORS.or} strokeWidth="5" strokeLinecap="round" />
			<path d="M140 204 L136 236 M136 236 L126 242 M136 236 L144 243 M180 204 L184 236 M184 236 L174 242 M184 236 L192 243" stroke={COLORS.or} strokeWidth="5" strokeLinecap="round" />
		</svg>
	);
};
