import type { SSRResult } from '../../@types/astro';
import { unescapeHTML } from './escape.js';

const animations = {
	'slide': {
		old: '--astro-animate-old-slideout',
		new: '--astro-animate-new-slidein',
		backOld: '--astro-animate-back-old-slideout-names',
		backNew: '--astro-animate-back-new-slideout-names',
	},
	'fade': {
		old: '--astro-animate-old-fade',
		new: '--astro-animate-new-fade',
	}
};

const transitionNameMap = new WeakMap<SSRResult, number>();
function incrementTransitionNumber(result: SSRResult) {
	let num = 1;
	if(transitionNameMap.has(result)) {
		num = transitionNameMap.get(result)! + 1;
	}
	transitionNameMap.set(result, num);
	return num;
}

function createTransitionName(result: SSRResult) {
	return `astro-transition-${incrementTransitionNumber(result)}`;
}

export function renderTransition(result: SSRResult, hash: string, animationName: string | undefined, transitionName: string) {
	if(!animationName) {
		// TODO error?
		return '';
	}
	const animation = animations[animationName as keyof typeof animations];
	if(!transitionName) {
		transitionName = createTransitionName(result);
	}

	return unescapeHTML(`<style>[data-astro-transition-scope="${hash}"] {
	view-transition-name: ${transitionName};
}
${animationName === 'morph' ? '' : `
::view-transition-old(${transitionName}) {
	animation: var(${animation.old});
}
::view-transition-new(${transitionName}) {
	animation: var(${animation.new});
}

${('backOld' in animation) && ('backNew' in animation) ? `
.astro-back-transition::view-transition-old(${transitionName}) {
  animation-name: var(${animation.backOld});
}
.astro-back-transition::view-transition-new(${transitionName}) {
  animation-name: var(${animation.backNew});
}
`.trim() : ''}

`.trim()}
</style>`);
}
