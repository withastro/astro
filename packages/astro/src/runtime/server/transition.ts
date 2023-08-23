import type {
	SSRResult,
	TransitionAnimation,
	TransitionAnimationValue,
	TransitionDirectionalAnimations,
} from '../../@types/astro';
import { fade, slide, crossfade } from '../../transitions/index.js';
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

export function createTransitionScope(result: SSRResult, hash: string) {
	const num = incrementTransitionNumber(result);
	return `astro-${hash}-${num}`;
}

// Ensure animationName is a valid CSS identifier
function toValidIdent(name: string): string {
	return name.replace(/[^a-zA-Z0-9\-\_]/g, '_').replace(/^\_+|\_+$/g, '')
}

const BUILTIN_TRANSITION_ANIMATIONS = { fade, slide, crossfade };

export function renderTransition(
	result: SSRResult,
	hash: string,
	animationName: TransitionAnimationValue | undefined,
	transitionName: string
) {
	// Default to crossfade (similar to `initial`, but snappier)
	if (!animationName) animationName = 'crossfade';
	const scope = createTransitionScope(result, hash);
	const viewTransitionName = transitionName ? toValidIdent(transitionName) : scope;
	const styles = [
		`[data-astro-transition-scope="${scope}"] { view-transition-name: ${viewTransitionName}; }`,
	]
	if (animationName === 'fade' || animationName === 'slide' || animationName === 'crossfade') {
		styles.push(generateAnimationStyle(scope, viewTransitionName, BUILTIN_TRANSITION_ANIMATIONS[animationName]()))
	} else if (animationName === 'none') {
		styles.push(generateAnimationNone(scope, viewTransitionName))
	} else if (typeof animationName === 'object') {
		styles.push(generateAnimationStyle(scope, viewTransitionName, animationName))
	}
	result._metadata.extraHead.push(markHTMLString(`<style>${styles.join('')}</style>`));

	return scope;
}

function generateAnimationNone(scope: string, viewTransitionName: string) {
	const oldSelectors = [
		`::view-transition-old(${viewTransitionName})`,
		`[data-astro-transition-fallback=old] [data-astro-transition-scope="${scope}"]`,
	]
	const newSelectors = [
		`::view-transition-new(${viewTransitionName})`,
		`[data-astro-transition-fallback=new] [data-astro-transition-scope="${scope}"]`,
	]
	return [
		`${oldSelectors.join(', ')} { animation: none; opacity: 0; mix-blend-mode: normal; }`,
		`${newSelectors.join(', ')} { animation: none; mix-blend-mode: normal; }`,
	].join('')
}

function generateAnimationStyle(scope: string, viewTransitionName: string, animations: TransitionDirectionalAnimations) {
	return `::view-transition-old(${viewTransitionName}) {
	${stringifyAnimation(animations.forwards.old)}
}
[data-astro-transition-fallback=old] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.forwards.old)}
}
::view-transition-new(${viewTransitionName}) {
	${stringifyAnimation(animations.forwards.new)}
}
[data-astro-transition-fallback=new] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.forwards.new)}
}

[data-astro-transition=back]::view-transition-old(${viewTransitionName}) {
	${stringifyAnimation(animations.backwards.old)}
}
[data-astro-transition=back][data-astro-transition-fallback=old] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.backwards.old)}
}

[data-astro-transition=back]::view-transition-new(${viewTransitionName}) {
	${stringifyAnimation(animations.backwards.new)}
}
[data-astro-transition=back][data-astro-transition-fallback=new] [data-astro-transition-scope="${scope}"] {
	${stringifyAnimation(animations.backwards.new)}
}`;
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
