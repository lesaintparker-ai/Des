import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../config/theme';

// Fond bordeaux-noir avec braises qui montent et fumée lente.
export const Background: React.FC<{embers?: number; smoke?: boolean; seed?: string}> = ({
	embers = 36,
	smoke = true,
	seed = 'fond',
}) => {
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(120% 70% at 50% 18%, ${COLORS.bordeaux} 0%, ${COLORS.bordeauxNuit} 45%, ${COLORS.noir} 100%)`,
			}}
		>
			{smoke && <Smoke seed={seed} />}
			<Embers count={embers} seed={seed} />
			<AbsoluteFill
				style={{background: 'radial-gradient(90% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)'}}
			/>
		</AbsoluteFill>
	);
};

export const Embers: React.FC<{count: number; seed: string; opacity?: number}> = ({count, seed, opacity = 1}) => {
	const frame = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{opacity}}>
			{new Array(count).fill(0).map((_, i) => {
				const speed = 40 + random(`${seed}v${i}`) * 110; // px / s
				const size = 3 + random(`${seed}s${i}`) * 7;
				const x0 = random(`${seed}x${i}`) * width;
				const y = height + 40 - ((random(`${seed}y${i}`) * height * 1.3 + (frame / fps) * speed) % (height * 1.3));
				const x = x0 + Math.sin(frame / 22 + i) * 18;
				const life = interpolate(y, [0, height * 0.35, height], [0, 1, 0.6]);
				const gold = random(`${seed}c${i}`) > 0.5;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: size,
							height: size,
							borderRadius: '50%',
							background: gold ? '#FFC24A' : '#FF5A1F',
							boxShadow: `0 0 ${size * 3}px ${size}px ${gold ? 'rgba(255,170,40,0.55)' : 'rgba(255,70,20,0.5)'}`,
							opacity: life * (0.5 + 0.5 * Math.sin(frame / 5 + i * 3) ** 2),
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

export const Smoke: React.FC<{seed: string; opacity?: number}> = ({seed, opacity = 0.35}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill style={{opacity, filter: 'blur(60px)'}}>
			{[0, 1, 2, 3].map((i) => {
				const s = 700 + random(`${seed}fs${i}`) * 500;
				const x = random(`${seed}fx${i}`) * width - s / 2 + Math.sin(frame / 90 + i) * 120;
				const y = height - ((frame * (0.8 + i * 0.3) + random(`${seed}fy${i}`) * height) % (height + s));
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: s,
							height: s,
							borderRadius: '50%',
							background: 'radial-gradient(circle, rgba(230,215,205,0.45) 0%, rgba(230,215,205,0) 70%)',
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};
