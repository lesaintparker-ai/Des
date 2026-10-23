import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DrinkLayout, Price} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {Background} from './Background';
import {ease, fadeInOut, pop} from './anim';
import {CategoryLabel, Photo, PriceBadge} from './Ui';

type Box = {x: number; y: number; w: number; h: number};

// Emplacements des visuels (zone 60 → 1020 × 300 → 1200).
const LAYOUTS: Record<DrinkLayout, Box[]> = {
	single: [{x: 100, y: 310, w: 880, h: 880}],
	row: [
		{x: 60, y: 330, w: 470, h: 860},
		{x: 550, y: 330, w: 470, h: 860},
	],
	stack: [
		{x: 110, y: 300, w: 860, h: 480},
		{x: 110, y: 800, w: 860, h: 420},
	],
	feature: [
		{x: 60, y: 300, w: 470, h: 920},
		{x: 550, y: 300, w: 470, h: 450},
		{x: 550, y: 770, w: 470, h: 450},
	],
	video: [
		{x: 60, y: 300, w: 560, h: 920},
		{x: 640, y: 300, w: 380, h: 450},
		{x: 640, y: 770, w: 380, h: 450},
	],
};

const ROW3: Box[] = [
	{x: 50, y: 330, w: 316, h: 870},
	{x: 382, y: 330, w: 316, h: 870},
	{x: 714, y: 330, w: 316, h: 870},
];

// Présentation d'une boisson : visuels originaux (sans retouche), nom et prix.
export const DrinkCard: React.FC<{
	name: string;
	price: Price;
	images: string[];
	video?: string;
	layout: DrinkLayout;
	duration: number;
}> = ({name, price, images, video, layout, duration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const boxes = layout === 'row' && images.length === 3 ? ROW3 : LAYOUTS[layout];
	const media: {src: string; video?: boolean}[] = [...(video ? [{src: video, video: true}] : []), ...images.map((src) => ({src}))];
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed={name} embers={24} />
			<div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
				<CategoryLabel text="BOISSONS" size={58} />
			</div>
			{media.map((m, i) => {
				const b = boxes[i];
				const p = pop(frame, fps, i * 4, 13);
				const drift = Math.sin((frame + i * 20) / 40) * (6 + i * 3);
				return (
					<div
						key={m.src}
						style={{
							position: 'absolute',
							left: b.x,
							top: b.y + (1 - p) * 500 + drift,
							opacity: Math.min(1, p * 1.4),
							transform: `scale(${0.85 + 0.15 * p})`,
						}}
					>
						{m.video ? (
							<VideoBox src={m.src} w={b.w} h={b.h} />
						) : (
							<Photo src={m.src} width={b.w} height={b.h} radius={30} fit="contain" duration={duration} />
						)}
					</div>
				);
			})}
			<div style={{position: 'absolute', right: 20, top: 990}}>
				<PriceBadge price={price} delay={8} size={280} />
			</div>
			<div style={{position: 'absolute', top: 1290, left: 50, right: 50, textAlign: 'center'}}>
				<DrinkName text={name} delay={6} />
			</div>
		</AbsoluteFill>
	);
};

const VideoBox: React.FC<{src: string; w: number; h: number}> = ({src, w, h}) => (
	<div
		style={{
			width: w,
			height: h,
			borderRadius: 30,
			overflow: 'hidden',
			position: 'relative',
			border: `5px solid ${COLORS.or}`,
			boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
			background: COLORS.noir,
		}}
	>
		<OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
	</div>
);

const DrinkName: React.FC<{text: string; delay: number}> = ({text, delay}) => {
	const frame = useCurrentFrame();
	const r = ease(frame, delay, delay + 12);
	return (
		<div
			style={{
				fontFamily: FONTS.titre,
				fontSize: text.length > 15 ? 104 : 124,
				lineHeight: 1.05,
				color: COLORS.blanc,
				clipPath: `inset(0 ${(1 - r) * 100}% 0 0)`,
				textShadow: '0 10px 40px rgba(0,0,0,0.7)',
			}}
		>
			{text}
		</div>
	);
};
