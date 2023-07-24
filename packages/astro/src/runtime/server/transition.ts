import type {
	SSRResult,
	TransitionAnimation,
	TransitionAnimationValue,
	TransitionDirectionalAnimations,
} from '../../@types/astro';
import { fade, slide } from '../../transitions/index.js';
import { markHTMLString } from './escape.js';

const transitionNameMap = new WeakMap<SSRResult, number>();
function incrementTransitionNumber(result: SSRResult) {
	let num = 1;
	if (transitionNameMap.has(result)) {
		num = transitionNameMap.get(result)! + 1;
	}
	transitionNameMap.set(result, num);
	return num;
}

function createTransitionScope(result: SSRResult, hash: string) {
	const num = incrementTransitionNumber(result);
	return `astro-${hash}-${num}`;
}
export function renderTransition(
	result: SSRResult,
	hash: string,
	animationName: TransitionAnimationValue | undefined,
	transitionName: string
) {
	let animations: TransitionDirectionalAnimations | null = null;
	switch (animationName) {
		case 'fade': {
			animations = fade();
			break;
		}
		case 'slide': {
			animations = slide();
			break;
		}
		default: {
			if (typeof animationName === 'object') {
				animations = animationName;
			}
		}
	}

	const scope = createTransitionScope(result, hash);

	// Default transition name is the scope of the element, ie HASH-1
	if (!transitionName) {
		transitionName = scope;
	}

	const styles = markHTMLString(`<style>[data-astro-transition-scope="${scope}"] {
	view-transition-name: ${transitionName};
}
	${
		!animations
			? ``
			: // Regular animations
			  `
::view-transition-old(${transitionName}) {
	${stringifyAnimation(animations.forwards.old)}
}
[data-astro-transition-fallback=old] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.forwards.old)}
}

::view-transition-new(${transitionName}) {
	${stringifyAnimation(animations.forwards.new)}
}
[data-astro-transition-fallback=new] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.forwards.new)}
}

[data-astro-transition=back]::view-transition-old(${transitionName}) {
	${stringifyAnimation(animations.backwards.old)}
}
[data-astro-transition=back][data-astro-transition-fallback=old] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.backwards.old)}
}

[data-astro-transition=back]::view-transition-new(${transitionName}) {
	${stringifyAnimation(animations.backwards.new)}
}
[data-astro-transition=back][data-astro-transition-fallback=new] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.backwards.new)}
}
	`.trim()
	}
	</style>`);

	result._metadata.extraHead.push(styles);

	return scope;
}

type AnimationBuilder = {
	toString(): string;
	[key: string]: string[] | ((k: string) => string);
};

function addAnimationProperty(builder: AnimationBuilder, prop: string, value: string | number) {
	let arr = builder[prop];
	if (Array.isArray(arr)) {
		arr.push(value.toString());
	} else {
		builder[prop] = [value.toString()];
	}
}

function animationBuilder(): AnimationBuilder {
	return {
		toString() {
			let out = '';
			for (let k in this) {
				let value = this[k];
				if (Array.isArray(value)) {
					out += `\n\t${k}: ${value.join(', ')};`;
				}
			}
			return out;
		},
	};
}

function stringifyAnimation(anim: TransitionAnimation | TransitionAnimation[]): string {
	if (Array.isArray(anim)) {
		return stringifyAnimations(anim);
	} else {
		return stringifyAnimations([anim]);
	}
}

function stringifyAnimations(anims: TransitionAnimation[]): string {
	const builder = animationBuilder();

	for (const anim of anims) {
		/*300ms cubic-bezier(0.4, 0, 0.2, 1) both astroSlideFromRight;*/
		if (anim.duration) {
			addAnimationProperty(builder, 'animation-duration', toTimeValue(anim.duration));
		}
		if (anim.easing) {
			addAnimationProperty(builder, 'animation-timing-function', anim.easing);
		}
		if (anim.direction) {
			addAnimationProperty(builder, 'animation-direction', anim.direction);
		}
		if (anim.delay) {
			addAnimationProperty(builder, 'animation-delay', anim.delay);
		}
		if (anim.fillMode) {
			addAnimationProperty(builder, 'animation-fill-mode', anim.fillMode);
		}
		addAnimationProperty(builder, 'animation-name', anim.name);
	}

	return builder.toString();
}

function toTimeValue(num: number | string) {
	return typeof num === 'number' ? num + 'ms' : num;
}
