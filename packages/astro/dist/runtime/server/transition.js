import cssesc from '../../transitions/cssesc.js';
import { fade, slide } from '../../transitions/index.js';
import { markHTMLString } from './escape.js';
const transitionNameMap = /* @__PURE__ */ new WeakMap();
function incrementTransitionNumber(result) {
	let num = 1;
	if (transitionNameMap.has(result)) {
		num = transitionNameMap.get(result) + 1;
	}
	transitionNameMap.set(result, num);
	return num;
}
function createTransitionScope(result, hash) {
	const num = incrementTransitionNumber(result);
	return `astro-${hash}-${num}`;
}
const getAnimations = (name) => {
	if (name === 'fade') return fade();
	if (name === 'slide') return slide();
	if (typeof name === 'object') return name;
};
const addPairs = (animations, stylesheet) => {
	for (const [direction, images] of Object.entries(animations)) {
		for (const [image, rules] of Object.entries(images)) {
			stylesheet.addAnimationPair(direction, image, rules);
		}
	}
};
const reEncodeValidChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
	.split('')
	.reduce((v, c) => ((v[c.charCodeAt(0)] = c), v), []);
const reEncodeInValidStart = '-0123456789_'
	.split('')
	.reduce((v, c) => ((v[c.charCodeAt(0)] = c), v), []);
function reEncode(s) {
	let result = '';
	let codepoint;
	for (let i = 0; i < s.length; i += (codepoint ?? 0) > 65535 ? 2 : 1) {
		codepoint = s.codePointAt(i);
		if (codepoint !== void 0) {
			result +=
				codepoint < 128
					? codepoint === 95
						? '__'
						: (reEncodeValidChars[codepoint] ?? '_' + codepoint.toString(16).padStart(2, '0'))
					: String.fromCodePoint(codepoint);
		}
	}
	return reEncodeInValidStart[result.codePointAt(0) ?? 0] ? '_' + result : result;
}
function renderTransition(result, hash, animationName, transitionName) {
	if (typeof (transitionName ?? '') !== 'string') {
		throw new Error(`Invalid transition name {${transitionName}}`);
	}
	if (!animationName) animationName = 'fade';
	const scope = createTransitionScope(result, hash);
	const name = transitionName ? cssesc(reEncode(transitionName), { isIdentifier: true }) : scope;
	const sheet = new ViewTransitionStyleSheet(scope, name);
	const animations = getAnimations(animationName);
	if (animations) {
		addPairs(animations, sheet);
	} else if (animationName === 'none') {
		sheet.addFallback('old', 'animation: none; mix-blend-mode: normal;');
		sheet.addModern('old', 'animation: none; opacity: 0; mix-blend-mode: normal;');
		sheet.addAnimationRaw('new', 'animation: none; mix-blend-mode: normal;');
		sheet.addModern('group', 'animation: none');
	}
	const css = sheet.toString();
	result._metadata.extraHead.push(markHTMLString(`<style>${css}</style>`));
	return scope;
}
function createAnimationScope(transitionName, animations) {
	const hash = Math.random().toString(36).slice(2, 8);
	const scope = `astro-${hash}`;
	const sheet = new ViewTransitionStyleSheet(scope, transitionName);
	addPairs(animations, sheet);
	return { scope, styles: sheet.toString().replaceAll('"', '') };
}
class ViewTransitionStyleSheet {
	modern = [];
	fallback = [];
	scope;
	name;
	constructor(scope, name) {
		this.scope = scope;
		this.name = name;
	}
	toString() {
		const { scope, name } = this;
		const [modern, fallback] = [this.modern, this.fallback].map((rules) => rules.join(''));
		return [
			`[data-astro-transition-scope="${scope}"] { view-transition-name: ${name}; }`,
			this.layer(modern),
			fallback,
		].join('');
	}
	layer(cssText) {
		return cssText ? `@layer astro { ${cssText} }` : '';
	}
	addRule(target, cssText) {
		this[target].push(cssText);
	}
	addAnimationRaw(image, animation) {
		this.addModern(image, animation);
		this.addFallback(image, animation);
	}
	addModern(image, animation) {
		const { name } = this;
		this.addRule('modern', `::view-transition-${image}(${name}) { ${animation} }`);
	}
	addFallback(image, animation) {
		const { scope } = this;
		this.addRule(
			'fallback',
			// Two selectors here, the second in case there is an animation on the root.
			`[data-astro-transition-fallback="${image}"] [data-astro-transition-scope="${scope}"],
			[data-astro-transition-fallback="${image}"][data-astro-transition-scope="${scope}"] { ${animation} }`,
		);
	}
	addAnimationPair(direction, image, rules) {
		const { scope, name } = this;
		const animation = stringifyAnimation(rules);
		const prefix =
			direction === 'backwards'
				? `[data-astro-transition=back]`
				: direction === 'forwards'
					? ''
					: `[data-astro-transition=${direction}]`;
		this.addRule('modern', `${prefix}::view-transition-${image}(${name}) { ${animation} }`);
		this.addRule(
			'fallback',
			`${prefix}[data-astro-transition-fallback="${image}"] [data-astro-transition-scope="${scope}"],
			${prefix}[data-astro-transition-fallback="${image}"][data-astro-transition-scope="${scope}"] { ${animation} }`,
		);
	}
}
function addAnimationProperty(builder, prop, value) {
	let arr = builder[prop];
	if (Array.isArray(arr)) {
		arr.push(value.toString());
	} else {
		builder[prop] = [value.toString()];
	}
}
function animationBuilder() {
	return {
		toString() {
			let out = '';
			for (let k in this) {
				let value = this[k];
				if (Array.isArray(value)) {
					out += `
	${k}: ${value.join(', ')};`;
				}
			}
			return out;
		},
	};
}
function stringifyAnimation(anim) {
	if (Array.isArray(anim)) {
		return stringifyAnimations(anim);
	} else {
		return stringifyAnimations([anim]);
	}
}
function stringifyAnimations(anims) {
	const builder = animationBuilder();
	for (const anim of anims) {
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
function toTimeValue(num) {
	return typeof num === 'number' ? num + 'ms' : num;
}
export {
	ViewTransitionStyleSheet,
	createAnimationScope,
	createTransitionScope,
	reEncode,
	renderTransition,
	stringifyAnimation,
	stringifyAnimations,
	toTimeValue,
};
