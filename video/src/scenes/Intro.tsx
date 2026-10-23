import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EVENT, VIDEOS} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {Background, Embers} from '../components/Background';
import {BrandTitle} from '../components/BrandTitle';
import {Logo} from '../components/Logo';
import {Headline, Vignette} from '../components/Ui';
import {clamp, ease, fadeInOut, pop, sec} from '../components/anim';

// Scène 1 — Accroche : « Hééé, mes gars, mes go, les amis ! Vous êtes prêts ? »
export const Hook: React.FC<{duration: number; pretsAt: number}> = ({duration, pretsAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words: [string, number, string][] = [
		['HÉÉÉ,', 0.05, COLORS.orClair],
		['MES GARS,', 0.75, COLORS.blanc],
		['MES GO,', 1.45, COLORS.blanc],
		['LES AMIS !', 2.05, COLORS.orClair],
	];
	const zoom = interpolate(frame, [0, duration], [1, 1.1]);
	const pretsP = pop(frame, fps, sec(pretsAt, fps), 9);
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 4), backgroundColor: COLORS.noir}}>
			<AbsoluteFill style={{transform: `scale(${zoom})`}}>
				<OffthreadVideo
					src={staticFile(VIDEOS.grilleFumee)}
					startFrom={sec(2, fps)}
					muted
					style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.15) contrast(1.05)'}}
				/>
			</AbsoluteFill>
			<AbsoluteFill
				style={{background: `linear-gradient(180deg, rgba(14,5,7,0.92) 0%, rgba(74,14,20,0.55) 45%, rgba(14,5,7,0.85) 100%)`}}
			/>
			<Embers count={30} seed="hook" />
			<Vignette strength={0.75} />
			<div style={{position: 'absolute', top: 330, width: '100%'}}>
				{words.map(([w, t, color]) => {
					const p = pop(frame, fps, sec(t, fps), 11);
					return (
						<div
							key={w}
							style={{
								fontFamily: FONTS.titre,
								fontSize: 150,
								lineHeight: 1.08,
								textAlign: 'center',
								color,
								transform: `scale(${0.5 + 0.5 * p}) translateY(${(1 - p) * 60}px)`,
								opacity: Math.min(1, p * 1.6) * interpolate(pretsP, [0, 1], [1, 0.35]),
								textShadow: '0 10px 40px rgba(0,0,0,0.8)',
							}}
						>
							{w}
						</div>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1140,
					width: '100%',
					textAlign: 'center',
					transform: `scale(${pretsP}) rotate(${interpolate(pretsP, [0, 1], [-8, -3])}deg)`,
				}}
			>
				<span
					style={{
						display: 'inline-block',
						fontFamily: FONTS.titre,
						fontSize: 108,
						color: COLORS.blanc,
						background: COLORS.rouge,
						padding: '12px 40px',
						borderRadius: 24,
						border: `5px solid ${COLORS.or}`,
						boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
					}}
				>
					VOUS ÊTES PRÊTS ?
				</span>
			</div>
		</AbsoluteFill>
	);
};

// Scène 2 — « Le samedi 31 octobre, on se retrouve où ? » → AU BRUNCH ENTRE'AMIS
export const DateBrand: React.FC<{duration: number; questionAt: number; brandAt: number}> = ({duration, questionAt, brandAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const brandF = sec(brandAt, fps);
	const out = ease(frame, brandF - 4, brandF + 6);
	const big = pop(frame, fps, sec(0.55, fps), 9);
	const logoP = pop(frame, fps, brandF, 10);
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed="date" />
			<AbsoluteFill style={{opacity: 0.22, filter: 'blur(10px)'}}>
				<OffthreadVideo src={staticFile(VIDEOS.grillRue)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 70%'}} />
			</AbsoluteFill>
			<Vignette />
			{/* Date */}
			<AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 - out * 0.3})`, filter: `blur(${out * 16}px)`}}>
				<div style={{position: 'absolute', top: 300, width: '100%'}}>
					<Headline text={`LE ${EVENT.jour}`} size={130} delay={2} />
					<div
						style={{
							fontFamily: FONTS.titre,
							fontSize: 520,
							lineHeight: 0.95,
							textAlign: 'center',
							color: COLORS.or,
							transform: `scale(${big})`,
							textShadow: `0 0 ${40 + 30 * Math.sin(frame / 6)}px rgba(227,167,47,0.6), 0 20px 50px rgba(0,0,0,0.7)`,
						}}
					>
						{EVENT.date}
					</div>
					<Headline text={EVENT.mois} size={170} delay={sec(0.85, fps)} />
					<div style={{height: 40}} />
					<Headline text="ON SE RETROUVE OÙ ?" size={96} color={COLORS.orClair} delay={sec(questionAt, fps)} />
				</div>
			</AbsoluteFill>
			{/* Marque */}
			<AbsoluteFill style={{opacity: interpolate(frame, [brandF - 2, brandF + 2], [0, 1], clamp)}}>
				<div style={{position: 'absolute', top: 330, width: '100%', display: 'flex', justifyContent: 'center', transform: `scale(${logoP})`}}>
					<Logo size={300} />
				</div>
				<div style={{position: 'absolute', top: 700, width: '100%'}}>
					<Headline text="AU" size={90} color={COLORS.orClair} delay={brandF} />
					<BrandTitle delay={brandF + 2} size={200} stagger={1.2} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
