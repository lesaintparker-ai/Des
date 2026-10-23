import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, CONTACTS, EVENT} from '../config/content';
import {COLORS, FONTS} from '../config/theme';
import {Background} from '../components/Background';
import {BrandTitle} from '../components/BrandTitle';
import {Logo} from '../components/Logo';
import {CategoryLabel, Headline, Vignette} from '../components/Ui';
import {clamp, ease, fadeInOut, pop, sec} from '../components/anim';

// « Alors, notez bien ! »
export const Notez: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const line = ease(frame, 10, 28);
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 4)}}>
			<Background seed="notez" />
			<div style={{position: 'absolute', top: 760, width: '100%'}}>
				<Headline text="ALORS," size={110} delay={0} color={COLORS.orClair} />
				<Headline text="NOTEZ BIEN !" size={190} delay={6} />
				<div style={{margin: '10px auto 0', width: 700 * line, height: 12, borderRadius: 6, background: COLORS.or}} />
			</div>
		</AbsoluteFill>
	);
};

const PinIcon: React.FC<{size?: number}> = ({size = 90}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill={COLORS.rouge} stroke={COLORS.or} strokeWidth="1.2" />
		<circle cx="12" cy="9" r="2.6" fill={COLORS.creme} />
	</svg>
);

const PhoneIcon: React.FC<{size?: number}> = ({size = 64}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<circle cx="12" cy="12" r="11.5" fill={COLORS.rouge} stroke={COLORS.or} strokeWidth="1" />
		<path
			d="M8.6 6.5l1.6-.4 1.2 2.8-1.1.9a7 7 0 003.6 3.6l.9-1.1 2.8 1.2-.4 1.6c-.2.7-.8 1.1-1.5 1-4.6-.6-8.1-4.1-8.7-8.7-.1-.7.3-1.3 1-1.5z"
			fill={COLORS.blanc}
		/>
	</svg>
);

// Carte d'invitation : date et lieu en grand.
const EventCard: React.FC<{lieuAt: number; terrainAt: number; dateDelay?: number}> = ({lieuAt, terrainAt, dateDelay = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const big = pop(frame, fps, dateDelay + 4, 9);
	const lieu = pop(frame, fps, lieuAt, 11);
	const terrain = ease(frame, terrainAt, terrainAt + 10);
	const rule = ease(frame, dateDelay, dateDelay + 20);
	return (
		<div style={{textAlign: 'center'}}>
			<div style={{margin: '0 auto', width: 760 * rule, height: 5, background: `linear-gradient(90deg, transparent, ${COLORS.or}, transparent)`}} />
			<Headline text={EVENT.jour} size={140} delay={dateDelay} style={{marginTop: 24}} />
			<div
				style={{
					fontFamily: FONTS.titre,
					fontSize: 430,
					lineHeight: 0.95,
					color: COLORS.or,
					transform: `scale(${big})`,
					textShadow: `0 0 ${40 + 30 * Math.sin(frame / 6)}px rgba(227,167,47,0.55), 0 20px 50px rgba(0,0,0,0.7)`,
				}}
			>
				{EVENT.date}
			</div>
			<Headline text={`${EVENT.mois} ${EVENT.annee}`} size={130} delay={dateDelay + 8} />
			<div style={{margin: '26px auto 0', width: 760 * rule, height: 5, background: `linear-gradient(90deg, transparent, ${COLORS.or}, transparent)`}} />
			<div
				style={{
					marginTop: 40,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 18,
					transform: `translateY(${(1 - lieu) * 80}px)`,
					opacity: Math.min(1, lieu * 1.5),
				}}
			>
				<PinIcon size={110} />
				<span style={{fontFamily: FONTS.titre, fontSize: 112, color: COLORS.blanc, textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>
					{EVENT.lieu}
				</span>
			</div>
			<div
				style={{
					fontFamily: FONTS.texte,
					fontWeight: 800,
					fontSize: 64,
					color: COLORS.orClair,
					marginTop: 6,
					clipPath: `inset(0 ${(1 - terrain) * 50}% 0 ${(1 - terrain) * 50}%)`,
				}}
			>
				{EVENT.precision}
			</div>
		</div>
	);
};

// « Samedi 31 octobre 2026 ! À Akekoi Village, au terrain de football ! »
export const Rdv: React.FC<{duration: number; lieuAt: number; terrainAt: number}> = ({duration, lieuAt, terrainAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed="rdv" embers={44} />
			<Vignette />
			<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
				<CategoryLabel text="RENDEZ-VOUS" size={86} />
			</div>
			<div style={{position: 'absolute', top: 360, width: '100%'}}>
				<EventCard lieuAt={sec(lieuAt, fps)} terrainAt={sec(terrainAt, fps)} />
			</div>
		</AbsoluteFill>
	);
};

const ContactButton: React.FC<{delay: number; size?: number}> = ({delay, size = 96}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = pop(frame, fps, delay, 10);
	const breathe = 1 + 0.025 * Math.sin(frame / 7);
	return (
		<div style={{textAlign: 'center', transform: `scale(${p * breathe})`}}>
			<span
				style={{
					display: 'inline-block',
					fontFamily: FONTS.titre,
					fontSize: size,
					color: COLORS.blanc,
					background: `linear-gradient(180deg, ${COLORS.rougeVif}, ${COLORS.rouge})`,
					padding: `${size * 0.14}px ${size * 0.5}px`,
					borderRadius: 999,
					border: `5px solid ${COLORS.or}`,
					boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(224,37,47,0.45)`,
					letterSpacing: 2,
				}}
			>
				CONTACTEZ-NOUS
			</span>
		</div>
	);
};

const Phones: React.FC<{delay: number; stagger: number; size?: number}> = ({delay, stagger, size = 76}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.3}}>
			{CONTACTS.map((num, i) => {
				const p = pop(frame, fps, delay + i * stagger, 12);
				return (
					<div
						key={num}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							transform: `translateX(${(1 - p) * (i % 2 ? 600 : -600)}px)`,
							opacity: Math.min(1, p * 1.5),
						}}
					>
						<PhoneIcon size={size * 1.05} />
						<span style={{fontFamily: FONTS.texte, fontWeight: 800, fontSize: size, color: COLORS.blanc, letterSpacing: 1, textShadow: '0 6px 24px rgba(0,0,0,0.7)'}}>
							{num}
						</span>
					</div>
				);
			})}
		</div>
	);
};

// « Pour les renseignements, contactez-nous aux numéros affichés à l'écran ! »
export const Contacts: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: fadeInOut(frame, duration, 1, 5)}}>
			<Background seed="contacts" />
			<Vignette />
			<div style={{position: 'absolute', top: 360, width: '100%'}}>
				<Headline text="POUR LES RENSEIGNEMENTS" size={80} color={COLORS.orClair} delay={0} />
			</div>
			<div style={{position: 'absolute', top: 560, width: '100%'}}>
				<ContactButton delay={6} size={120} />
			</div>
			<div style={{position: 'absolute', top: 860, width: '100%'}}>
				<Phones delay={14} stagger={8} size={84} />
			</div>
		</AbsoluteFill>
	);
};

// Écran final : logo, marque, date, lieu, contacts — reste fixe et lisible.
export const Final: React.FC<{duration: number; dateAt: number}> = ({duration, dateAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const logo = pop(frame, fps, 0, 10);
	const dateF = sec(dateAt, fps);
	const info = ease(frame, dateF, dateF + 12);
	const end = interpolate(frame, [duration - 12, duration], [1, 0], clamp);
	return (
		<AbsoluteFill style={{opacity: Math.min(fadeInOut(frame, duration, 1, 1), end + 0.0001)}}>
			<Background seed="final" embers={40} />
			<Vignette />
			<div style={{position: 'absolute', top: 130, width: '100%', display: 'flex', justifyContent: 'center', transform: `scale(${logo})`}}>
				<Logo size={230} />
			</div>
			<div style={{position: 'absolute', top: 380, width: '100%'}} aria-label={BRAND}>
				<BrandTitle delay={2} size={170} stagger={0.8} />
			</div>
			<div
				style={{
					position: 'absolute',
					top: 760,
					left: 70,
					right: 70,
					padding: '30px 20px',
					borderRadius: 34,
					border: `4px solid ${COLORS.or}`,
					background: 'rgba(14,5,7,0.55)',
					textAlign: 'center',
					opacity: info,
					transform: `translateY(${(1 - info) * 60}px)`,
				}}
			>
				<div style={{fontFamily: FONTS.titre, fontSize: 84, color: COLORS.or, lineHeight: 1.05, whiteSpace: 'nowrap'}}>
					{`${EVENT.jour} ${EVENT.date} ${EVENT.mois} ${EVENT.annee}`}
				</div>
				<div style={{fontFamily: FONTS.titre, fontSize: 80, color: COLORS.blanc, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>
					<PinIcon size={76} />
					{EVENT.lieu}
				</div>
				<div style={{fontFamily: FONTS.texte, fontWeight: 800, fontSize: 52, color: COLORS.orClair}}>{EVENT.precision}</div>
			</div>
			<div style={{position: 'absolute', top: 1150, width: '100%'}}>
				<ContactButton delay={dateF + 10} size={84} />
			</div>
			<div style={{position: 'absolute', top: 1310, width: '100%'}}>
				<Phones delay={dateF + 16} stagger={5} size={60} />
			</div>
		</AbsoluteFill>
	);
};
