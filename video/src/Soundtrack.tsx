import React from 'react';
import {Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {AUDIO, BOISSONS, PORC, T, VOLAILLES, VO_OFFSET, ACCOMPAGNEMENTS} from './config/content';
import {clamp, sec} from './components/anim';

type Cue = {at: number; sfx: keyof typeof AUDIO.sfx; volume: number};

// Voix off, musique provisoire et effets sonores.
export const Soundtrack: React.FC = () => {
	const {fps} = useVideoConfig();
	const s = (x: number) => sec(x, fps);
	const cues: Cue[] = [
		{at: 0, sfx: 'grille', volume: 0.5},
		{at: T.hookPrets, sfx: 'pop', volume: 0.6},
		{at: T.dateBrand.start + 0.55, sfx: 'impact', volume: 0.7},
		{at: T.brandSlam, sfx: 'impact', volume: 0.8},
		{at: T.brandSlam + 0.3, sfx: 'eclat', volume: 0.6},
		...[T.porcLabel.start, T.faim.start, T.volaillesLabel.start, T.accompagnements.start, T.notez.start].map((at) => ({at: at - 0.15, sfx: 'whoosh' as const, volume: 0.5})),
		{at: T.boissonsLabel.start - 0.1, sfx: 'decapsule', volume: 0.7},
		{at: T.faim.start, sfx: 'grille', volume: 0.45},
		...[...PORC, ...VOLAILLES, ...BOISSONS].map((d) => ({at: d.start + 0.2, sfx: 'pop' as const, volume: 0.55})),
		...[...PORC, ...VOLAILLES, ...BOISSONS].slice(1).map((d) => ({at: d.start - 0.12, sfx: 'whoosh' as const, volume: 0.3})),
		...ACCOMPAGNEMENTS.map((a) => ({at: a.at - 0.12, sfx: 'tic' as const, volume: 0.6})),
		{at: VOLAILLES[4].start + 0.25, sfx: 'eclat', volume: 0.5},
		{at: T.rdv.start + 0.15, sfx: 'impact', volume: 0.7},
		{at: T.rdvLieu, sfx: 'tic', volume: 0.6},
		{at: T.contacts.start + 0.2, sfx: 'pop', volume: 0.5},
		...[0, 1, 2].map((i) => ({at: T.contacts.start + (14 + i * 8) / 30, sfx: 'tic' as const, volume: 0.5})),
		{at: T.final.start, sfx: 'eclat', volume: 0.6},
	];
	const voEnd = 74.84 + VO_OFFSET;
	return (
		<>
			<Sequence from={s(VO_OFFSET)} name="Voix off">
				<Audio src={staticFile(AUDIO.voixOff)} volume={1} />
			</Sequence>
			<Audio
				src={staticFile(AUDIO.musique)}
				name="Musique provisoire"
				volume={(f) => interpolate(f / fps, [0, VO_OFFSET, voEnd - 0.3, voEnd + 0.4], [0.35, 0.16, 0.16, 0.42], clamp)}
			/>
			{cues.map((c, i) => (
				<Sequence key={i} from={Math.max(0, s(c.at))} name={`sfx ${c.sfx}`}>
					<Audio src={staticFile(AUDIO.sfx[c.sfx])} volume={c.volume * 0.6} />
				</Sequence>
			))}
		</>
	);
};
