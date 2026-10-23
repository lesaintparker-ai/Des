import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCOMPAGNEMENTS} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {Background, Embers} from '../components/Background';
import {CategoryLabel, Headline, Photo, Vignette} from '../components/Ui';
import {fadeInOut, pop, sec} from '../components/anim';

// Ouverture de catégorie : grande étiquette, sous-titre, fond vidéo ou éventail de photos.
export const CategoryIntro: React.FC<{
	label: string;
	subtitle: string;
	duration: number;
	video?: string;
	videoStart?: number;
	photos?: string[];
}> = ({label, subtitle, duration, video, videoStart = 0, photos = []}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed={label} />
			{video && (
				<AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, duration], [1.05, 1.15])})`}}>
					<OffthreadVideo src={staticFile(video)} startFrom={sec(videoStart, fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,5,7,0.55), rgba(74,14,20,0.45) 50%, rgba(14,5,7,0.9))'}} />
				</AbsoluteFill>
			)}
			{photos.map((src, i) => {
				const p = pop(frame, fps, 4 + i * 4, 12);
				const angle = (i - (photos.length - 1) / 2) * 12;
				return (
					<div
						key={src}
						style={{
							position: 'absolute',
							left: 540 - 230 + (i - (photos.length - 1) / 2) * 250,
							top: 900,
							transform: `rotate(${angle * p}deg) translateY(${(1 - p) * 700}px)`,
						}}
					>
						<Photo src={src} width={460} height={560} radius={32} duration={duration} />
					</div>
				);
			})}
			<Embers count={20} seed={`${label}-e`} />
			<Vignette strength={0.6} />
			<div style={{position: 'absolute', top: 420, width: '100%', textAlign: 'center'}}>
				<CategoryLabel text={label} size={130} delay={0} />
			</div>
			<div style={{position: 'absolute', top: 640, width: '100%'}}>
				<Headline text={subtitle} size={84} color={COLORS.orClair} delay={8} />
			</div>
		</AbsoluteFill>
	);
};

// « Rien que d'en parler… ça donne faim ! » sur le plan de cuisson.
export const Faim: React.FC<{duration: number; video: string}> = ({duration, video}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5), backgroundColor: COLORS.noir}}>
			<AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, duration], [1.05, 1.22])})`}}>
				<OffthreadVideo src={staticFile(video)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,5,7,0.2) 30%, rgba(14,5,7,0.92) 100%)'}} />
			<Vignette strength={0.7} />
			<div style={{position: 'absolute', top: 1040, width: '100%'}}>
				<Headline text="RIEN QUE D'EN PARLER…" size={96} delay={3} />
				<Headline text="ÇA DONNE FAIM !" size={150} color={COLORS.orClair} delay={30} />
			</div>
		</AbsoluteFill>
	);
};

// Accompagnements : trois médaillons en cascade, synchronisés sur la voix.
export const Accompagnements: React.FC<{duration: number; start: number}> = ({duration, start}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pos = [
		{x: 540, y: 690},
		{x: 285, y: 1230},
		{x: 795, y: 1230},
	];
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed="accomp" />
			<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
				<CategoryLabel text="ACCOMPAGNEMENT" size={86} />
			</div>
			<div style={{position: 'absolute', top: 330, width: '100%'}}>
				<Headline text="POUR ACCOMPAGNER TOUT ÇA" size={64} color={COLORS.orClair} delay={6} />
			</div>
			{ACCOMPAGNEMENTS.map((a, i) => {
				const p = pop(frame, fps, sec(a.at - start, fps) - 4, 10);
				const D = 380;
				return (
					<div
						key={a.name}
						style={{
							position: 'absolute',
							left: pos[i].x - D / 2,
							top: pos[i].y - D / 2,
							width: D,
							textAlign: 'center',
							transform: `scale(${p})`,
						}}
					>
						<div
							style={{
								width: D,
								height: D,
								borderRadius: '50%',
								overflow: 'hidden',
								border: `5px solid ${COLORS.or}`,
								background: `radial-gradient(circle at 50% 40%, #5A1A20, ${COLORS.noir})`,
								boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Img
								src={staticFile(a.photo)}
								style={
									a.cutout
										? {width: '82%', height: '82%', objectFit: 'contain'}
										: {width: '100%', height: '100%', objectFit: 'cover'}
								}
							/>
						</div>
						<div style={{fontFamily: FONTS.titre, fontSize: 84, color: COLORS.blanc, marginTop: 10, textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
							{a.name}
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
