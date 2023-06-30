import type { TransitionDirectionalAnimations, TransitionAnimationPair } from '../@types/astro';

export function slide({
	duration
}: {
	duration?: string | number;
} = {}): TransitionDirectionalAnimations {
	return {
		forwards: {
			old: [{
				name: 'astroFadeOut',
				duration: duration ?? '90ms',
				easing: 'cubic-bezier(0.4, 0, 1, 1)',
				fillMode: 'both'
			}, {
				name: 'astroSlideToLeft',
				duration: duration ?? '300ms',
				easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
				fillMode: 'both'
			}],
			new: [{
				name: 'astroFadeIn',
				duration: duration ?? '210ms',
				easing: 'cubic-bezier(0, 0, 0.2, 1)',
				delay: '90ms',
				fillMode: 'both'
			}, {
				name: 'astroSlideFromRight',
				duration: duration ?? '300ms',
				easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
				fillMode: 'both'
			}]
		},
		backwards: {
			old: [{ name: 'astroFadeOut' }, { name: 'astroSlideToRight' }],
			new: [{ name: 'astroFadeIn' }, { name: 'astroSlideFromLeft' }]
		}
	};
}

export function fade({
	duration
}: {
	duration?: string | number;
}): TransitionDirectionalAnimations {
	const anim = {
		old: {
			name: 'astroFadeInOut',
			duration: duration ?? '0.2s',
			easing: 'linear',
			direction: 'forwards',
		},
		new: {
			name: 'astroFadeInOut',
			duration: duration ?? '0.3s',
			easing: 'linear',
			direction: 'backwards',
		}
	} satisfies TransitionAnimationPair;

	return {
		forwards: anim,
		backwards: anim,
	};
}
