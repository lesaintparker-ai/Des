import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../config/theme';
import {pop} from './anim';

// « BRUNCH ENTRE'AMIS » : lettres qui tombent une à une avec léger rebond.
export const BrandTitle: React.FC<{delay?: number; size?: number; stagger?: number}> = ({delay = 0, size = 190, stagger = 1.6}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const lines = ['BRUNCH', "ENTRE'AMIS"];
	let k = 0;
	return (
		<div style={{textAlign: 'center', fontFamily: FONTS.titre, lineHeight: 1}}>
			{lines.map((line, li) => (
				<div key={line} style={{fontSize: li === 0 ? size * 0.82 : size, whiteSpace: 'nowrap'}}>
					{line.split('').map((ch) => {
						const p = pop(frame, fps, delay + k++ * stagger, 10);
						const isMark = ch === "'";
						return (
							<span
								key={k}
								style={{
									display: 'inline-block',
									color: isMark ? COLORS.or : li === 0 ? COLORS.orClair : COLORS.blanc,
									transform: `translateY(${(1 - p) * -220}px)`,
									opacity: Math.min(1, p * 2),
									textShadow: '0 12px 40px rgba(0,0,0,0.7)',
								}}
							>
								{ch}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};
