import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Price} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {Background} from './Background';
import {PintadeIllustration} from './Logo';
import {clamp, ease, fadeInOut, pop} from './anim';
import {CategoryLabel, Photo, PriceBadge} from './Ui';

type Dir = 'top' | 'left' | 'right';

// Présentation d'un plat : grand médaillon photo, vapeur, nom, pastille de prix.
export const DishCard: React.FC<{
	category: string;
	name: string;
	price: Price;
	photo: string | null;
	extra?: string;
	objectPosition?: string;
	from?: Dir;
	duration: number;
	highlight?: boolean;
}> = ({category, name, price, photo, extra, objectPosition, from = 'top', duration, highlight}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = pop(frame, fps, 0, 14);
	const offset = (1 - enter) * 1300;
	const blur = interpolate(enter, [0, 0.7, 1], [24, 4, 0], clamp);
	const translate =
		from === 'top' ? `translateY(${-offset}px)` : from === 'left' ? `translateX(${-offset}px)` : `translateX(${offset}px)`;
	const exit = interpolate(frame, [duration - 6, duration], [0, 1], clamp);
	const W = 880;
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed={name} />
			<div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center'}}>
				<CategoryLabel text={category} size={58} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: (1080 - W) / 2,
					top: 300,
					transform: `${translate} scale(${1 - exit * 0.08})`,
					filter: `blur(${blur}px)`,
				}}
			>
				{photo ? (
					<Photo src={photo} width={W} height={W} radius={60} objectPosition={objectPosition} duration={duration} />
				) : (
					<div
						style={{
							width: W,
							height: W,
							borderRadius: 60,
							border: `5px solid ${COLORS.or}`,
							background: `radial-gradient(circle at 50% 40%, #3A0B11 0%, ${COLORS.noir} 80%)`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
						}}
					>
						<div style={{transform: `scale(${0.9 + 0.05 * Math.sin(frame / 12)})`}}>
							<PintadeIllustration size={840} />
						</div>
					</div>
				)}
				<Steam />
			</div>
			{extra && (
				<div style={{position: 'absolute', left: 40, top: 960, transform: `scale(${pop(frame, fps, 10, 10)})`}}>
					<Photo src={extra} width={300} height={300} radius="50%" duration={duration} />
				</div>
			)}
			<div style={{position: 'absolute', right: 30, top: 230}}>
				<PriceBadge price={price} delay={6} size={highlight ? 360 : 320} big={highlight} />
			</div>
			<div style={{position: 'absolute', top: 1260, width: '100%', padding: '0 50px', textAlign: 'center'}}>
				<DishName text={name} delay={8} />
			</div>
		</AbsoluteFill>
	);
};

const DishName: React.FC<{text: string; delay: number}> = ({text, delay}) => {
	const frame = useCurrentFrame();
	const r = ease(frame, delay, delay + 14);
	const size = text.length > 14 ? 112 : 140;
	return (
		<div>
			<div
				style={{
					fontFamily: FONTS.titre,
					fontSize: size,
					lineHeight: 1.05,
					color: COLORS.blanc,
					clipPath: `inset(0 ${(1 - r) * 100}% 0 0)`,
					textShadow: '0 10px 40px rgba(0,0,0,0.7)',
				}}
			>
				{text}
			</div>
			<div
				style={{
					margin: '18px auto 0',
					height: 6,
					width: 420 * r,
					background: `linear-gradient(90deg, transparent, ${COLORS.or}, transparent)`,
				}}
			/>
		</div>
	);
};

// Volutes de vapeur au-dessus du plat.
const Steam: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 0, top: -120, width: 880, height: 400, pointerEvents: 'none', filter: 'blur(26px)'}}>
			{[0, 1, 2].map((i) => {
				const cycle = ((frame + i * 25) % 75) / 75;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 220 + i * 170 + Math.sin(frame / 14 + i) * 30,
							top: 260 - cycle * 260,
							width: 160,
							height: 240,
							borderRadius: '50%',
							background: 'rgba(255,255,255,0.5)',
							opacity: Math.sin(cycle * Math.PI) * 0.55,
						}}
					/>
				);
			})}
		</div>
	);
};
