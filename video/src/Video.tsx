import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {BOISSONS, PORC, T, VIDEOS, VOLAILLES} from './config/content';
import {COLORS} from './config/theme';
import {DishCard} from './components/DishCard';
import {DrinkCard} from './components/DrinkCard';
import {HeatFlash} from './components/Ui';
import {sec} from './components/anim';
import {DateBrand, Hook} from './scenes/Intro';
import {Accompagnements, CategoryIntro, Faim} from './scenes/Sections';
import {Contacts, Final, Notez, Rdv} from './scenes/Event';
import {Soundtrack} from './Soundtrack';

// Composition principale : enchaîne les scènes selon la chronologie de la voix off.
export const BrunchVideo: React.FC = () => {
	const {fps} = useVideoConfig();
	const span = (start: number, end: number) => ({from: sec(start, fps), durationInFrames: sec(end, fps) - sec(start, fps)});
	const dur = (start: number, end: number) => span(start, end).durationInFrames;
	const dirs = ['top', 'left', 'right'] as const;
	const flashes = [T.porcLabel.start, T.volaillesLabel.start, T.accompagnements.start, T.boissonsLabel.start, T.notez.start, T.final.start];
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.noir}}>
			<Sequence {...span(T.hook.start, T.hook.end)} name="1. Accroche">
				<Hook duration={dur(T.hook.start, T.hook.end)} pretsAt={T.hookPrets - T.hook.start} />
			</Sequence>
			<Sequence {...span(T.dateBrand.start, T.dateBrand.end)} name="2. Date et marque">
				<DateBrand
					duration={dur(T.dateBrand.start, T.dateBrand.end)}
					questionAt={T.dateQuestion - T.dateBrand.start}
					brandAt={T.brandSlam - T.dateBrand.start}
				/>
			</Sequence>
			<Sequence {...span(T.porcLabel.start, T.porcLabel.end)} name="3. Porc au four">
				<CategoryIntro
					label="PORC AU FOUR"
					subtitle="AU MENU, LE BON PORC AU FOUR !"
					duration={dur(T.porcLabel.start, T.porcLabel.end)}
					photos={[PORC[0].photo, PORC[1].photo]}
				/>
			</Sequence>
			{PORC.map((d, i) => (
				<Sequence key={d.name} {...span(d.start, d.end)} name={d.name}>
					<DishCard category="PORC AU FOUR" {...d} from={dirs[i % 3]} duration={dur(d.start, d.end)} />
				</Sequence>
			))}
			<Sequence {...span(T.faim.start, T.faim.end)} name="Ça donne faim">
				<Faim duration={dur(T.faim.start, T.faim.end)} video={VIDEOS.cuisson} />
			</Sequence>
			<Sequence {...span(T.volaillesLabel.start, T.volaillesLabel.end)} name="4. Volailles">
				<CategoryIntro
					label="VOLAILLES"
					subtitle="ET CE N'EST PAS FINI !"
					duration={dur(T.volaillesLabel.start, T.volaillesLabel.end)}
					video={VIDEOS.grilleFumee}
					videoStart={5}
				/>
			</Sequence>
			{VOLAILLES.map((d, i) => (
				<Sequence key={d.name} {...span(d.start, d.end)} name={d.name}>
					<DishCard category="VOLAILLES" {...d} from={dirs[(i + 1) % 3]} duration={dur(d.start, d.end)} highlight={i === VOLAILLES.length - 1} />
				</Sequence>
			))}
			<Sequence {...span(T.accompagnements.start, T.accompagnements.end)} name="5. Accompagnements">
				<Accompagnements duration={dur(T.accompagnements.start, T.accompagnements.end)} start={T.accompagnements.start} />
			</Sequence>
			<Sequence {...span(T.boissonsLabel.start, T.boissonsLabel.end)} name="6. Boissons">
				<CategoryIntro
					label="BOISSONS"
					subtitle="ÉCOUTEZ BIEN LES PRIX !"
					duration={dur(T.boissonsLabel.start, T.boissonsLabel.end)}
					video={VIDEOS.desperados}
				/>
			</Sequence>
			{BOISSONS.map((d) => (
				<Sequence key={d.name} {...span(d.start, d.end)} name={d.name}>
					<DrinkCard {...d} duration={dur(d.start, d.end)} />
				</Sequence>
			))}
			<Sequence {...span(T.notez.start, T.notez.end)} name="7. Notez bien">
				<Notez duration={dur(T.notez.start, T.notez.end)} />
			</Sequence>
			<Sequence {...span(T.rdv.start, T.rdv.end)} name="8. Rendez-vous">
				<Rdv duration={dur(T.rdv.start, T.rdv.end)} lieuAt={T.rdvLieu - T.rdv.start} terrainAt={T.rdvTerrain - T.rdv.start} />
			</Sequence>
			<Sequence {...span(T.contacts.start, T.contacts.end)} name="9. Contacts">
				<Contacts duration={dur(T.contacts.start, T.contacts.end)} />
			</Sequence>
			<Sequence {...span(T.final.start, T.final.end)} name="10. Écran final">
				<Final duration={dur(T.final.start, T.final.end)} dateAt={T.finalDate - T.final.start} />
			</Sequence>
			{flashes.map((t) => (
				<Sequence key={t} from={sec(t, fps) - 3} durationInFrames={14} name="Flash de chaleur">
					<HeatFlash />
				</Sequence>
			))}
			<Soundtrack />
		</AbsoluteFill>
	);
};
