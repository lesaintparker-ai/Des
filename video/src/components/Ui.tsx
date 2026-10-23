import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Price} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {clamp, ease, pop} from './anim';

// Étiquette de catégorie, reprise de l'affiche : rectangle blanc arrondi, texte bordeaux.
export const CategoryLabel: React.FC<{text: string; delay?: number; size?: number}> = ({text, delay = 0, size = 92}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = pop(frame, fps, delay, 11);
	const reveal = ease(frame, delay, delay + 14);
	return (
		<div
			style={{
				display: 'inline-block',
				background: COLORS.blanc,
				borderRadius: 28,
				padding: `${size * 0.16}px ${size * 0.5}px`,
				transform: `scale(${0.6 + 0.4 * p})`,
				opacity: Math.min(1, p * 1.5),
				boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
				clipPath: `inset(0 ${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}% round 28px)`,
			}}
		>
			<span style={{fontFamily: FONTS.titre, fontSize: size, color: COLORS.bordeaux, letterSpacing: 2, lineHeight: 1.1}}>
				{text}
			</span>
		</div>
	);
};

// Pastille de prix ronde rouge cerclée d'or.
export const PriceBadge: React.FC<{price: Price; delay?: number; size?: number; big?: boolean}> = ({
	price,
	delay = 0,
	size = 300,
	big = false,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = pop(frame, fps, delay, 9);
	const glow = big ? 0.5 + 0.5 * Math.sin(frame / 6) : 0;
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				background: `radial-gradient(circle at 35% 30%, ${COLORS.rougeVif} 0%, ${COLORS.rouge} 55%, #8E0B16 100%)`,
				border: `${size * 0.035}px solid ${COLORS.or}`,
				boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 ${30 + glow * 50}px rgba(227,167,47,${0.35 + glow * 0.4})`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				transform: `scale(${p}) rotate(${interpolate(p, [0, 1], [-25, -8])}deg)`,
				color: COLORS.blanc,
				textAlign: 'center',
			}}
		>
			{price.prefix && (
				<div style={{fontFamily: FONTS.texte, fontWeight: 800, fontSize: size * 0.1, color: COLORS.orClair, lineHeight: 1}}>
					{price.prefix}
				</div>
			)}
			<div style={{fontFamily: FONTS.titre, fontSize: size * (price.amount.length > 3 ? 0.27 : 0.33), lineHeight: 1.05}}>
				{price.amount}
			</div>
			<div style={{fontFamily: FONTS.texte, fontWeight: 800, fontSize: size * 0.11, letterSpacing: 2, lineHeight: 1}}>
				FCFA
			</div>
		</div>
	);
};

// Photo encadrée d'un filet doré, avec zoom lent.
export const Photo: React.FC<{
	src: string;
	width: number;
	height: number;
	radius?: number | string;
	objectPosition?: string;
	fit?: 'cover' | 'contain';
	zoom?: [number, number];
	duration?: number;
	border?: boolean;
	style?: React.CSSProperties;
}> = ({src, width, height, radius = 36, objectPosition = '50% 50%', fit = 'cover', zoom = [1.04, 1.14], duration = 90, border = true, style}) => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [0, duration], zoom, clamp);
	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				overflow: 'hidden',
				position: 'relative',
				border: border ? `5px solid ${COLORS.or}` : undefined,
				boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
				background: COLORS.noir,
				...style,
			}}
		>
			{fit === 'contain' && (
				<Img
					src={staticFile(src)}
					style={{position: 'absolute', inset: -40, width: width + 80, height: height + 80, objectFit: 'cover', filter: 'blur(28px) brightness(0.55)'}}
				/>
			)}
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: fit,
					objectPosition,
					transform: `scale(${fit === 'cover' ? scale : 1})`,
				}}
			/>
		</div>
	);
};

// Titre en capitales condensées, révélé par masque de bas en haut.
export const Headline: React.FC<{
	text: string;
	delay?: number;
	size?: number;
	color?: string;
	style?: React.CSSProperties;
}> = ({text, delay = 0, size = 110, color = COLORS.blanc, style}) => {
	const frame = useCurrentFrame();
	const r = ease(frame, delay, delay + 12);
	return (
		<div style={{overflow: 'hidden', paddingBottom: 8, ...style}}>
			<div
				style={{
					fontFamily: FONTS.titre,
					fontSize: size,
					lineHeight: 1.08,
					color,
					letterSpacing: 1,
					textAlign: 'center',
					transform: `translateY(${(1 - r) * 110}%)`,
					textShadow: '0 8px 30px rgba(0,0,0,0.6)',
				}}
			>
				{text}
			</div>
		</div>
	);
};

// Flash de chaleur doré (transition entre catégories).
export const HeatFlash: React.FC = () => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [0, 4, 12], [0, 0.85, 0], clamp);
	return (
		<AbsoluteFill
			style={{
				opacity: o,
				background: `radial-gradient(circle at 50% 50%, rgba(255,226,150,1) 0%, rgba(240,140,40,0.85) 35%, rgba(120,20,10,0) 75%)`,
				mixBlendMode: 'screen',
			}}
		/>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.7}) => (
	<AbsoluteFill style={{background: `radial-gradient(85% 60% at 50% 45%, transparent 40%, rgba(0,0,0,${strength}) 100%)`}} />
);
