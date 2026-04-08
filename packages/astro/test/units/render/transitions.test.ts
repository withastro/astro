import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ViewTransitionStyleSheet,
	reEncode,
	stringifyAnimation,
	stringifyAnimations,
	toTimeValue,
} from '../../../dist/runtime/server/transition.js';

describe('reEncode', () => {
	it('passes through simple alphanumeric strings unchanged', () => {
		assert.equal(reEncode('hello'), 'hello');
		assert.equal(reEncode('my-transition'), 'my-transition');
		assert.equal(reEncode('Hero123'), 'Hero123');
	});

	it('prepends underscore when string starts with a digit', () => {
		assert.equal(reEncode('1hero'), '_1hero');
	});

	it('prepends underscore when string starts with a minus sign', () => {
		assert.equal(reEncode('-hero'), '_-hero');
	});

	it('replaces spaces with their hex escape', () => {
		const result = reEncode('my hero');
		assert.ok(result.includes('_20'), `expected space encoded as _20, got ${result}`);
	});

	it('replaces dots with their hex escape', () => {
		const result = reEncode('hero.image');
		assert.ok(result.includes('_2e'), `expected . encoded as _2e, got ${result}`);
	});

	it('doubles underscores to avoid collision, and prepends _ if starts with underscore', () => {
		// '_' (code 95) encodes to '__'; since '__hero' starts with '_', a further '_' is prepended
		assert.equal(reEncode('_hero'), '___hero');
	});

	it('handles non-ASCII characters by copying them through', () => {
		const result = reEncode('héro');
		assert.ok(result.includes('é'), `expected é to pass through, got ${result}`);
	});
});

describe('toTimeValue', () => {
	it('converts 0 to "0ms"', () => {
		assert.equal(toTimeValue(0), '0ms');
	});

	it('converts positive number to "{n}ms"', () => {
		assert.equal(toTimeValue(300), '300ms');
		assert.equal(toTimeValue(1000), '1000ms');
	});

	it('passes string values through unchanged', () => {
		assert.equal(toTimeValue('0.3s'), '0.3s');
		assert.equal(toTimeValue('300ms'), '300ms');
	});
});

describe('stringifyAnimation', () => {
	it('serializes animation-name', () => {
		const result = stringifyAnimation({ name: 'fade-in' });
		assert.ok(result.includes('animation-name'), `expected animation-name, got ${result}`);
		assert.ok(result.includes('fade-in'));
	});

	it('serializes duration as ms when numeric', () => {
		const result = stringifyAnimation({ name: 'slide', duration: 300 });
		assert.ok(result.includes('animation-duration'), `expected animation-duration`);
		assert.ok(result.includes('300ms'));
	});

	it('serializes easing, direction, delay, and fillMode', () => {
		const result = stringifyAnimation({
			name: 'fade',
			easing: 'ease-in-out',
			direction: 'reverse',
			delay: 100,
			fillMode: 'both',
		});
		assert.ok(result.includes('animation-timing-function'));
		assert.ok(result.includes('ease-in-out'));
		assert.ok(result.includes('animation-direction'));
		assert.ok(result.includes('reverse'));
		assert.ok(result.includes('animation-fill-mode'));
		assert.ok(result.includes('both'));
	});

	it('accepts an array of animations', () => {
		const result = stringifyAnimation([{ name: 'fade-in' }, { name: 'slide-in' }]);
		assert.ok(result.includes('fade-in'));
		assert.ok(result.includes('slide-in'));
	});
});

describe('stringifyAnimations', () => {
	it('merges multiple animation names into one animation-name declaration', () => {
		const result = stringifyAnimations([{ name: 'fade-in' }, { name: 'slide-in' }]);
		assert.ok(result.includes('animation-name'));
		assert.ok(result.includes('fade-in'));
		assert.ok(result.includes('slide-in'));
	});

	it('merges multiple durations into one animation-duration declaration', () => {
		const result = stringifyAnimations([
			{ name: 'a', duration: 200 },
			{ name: 'b', duration: 400 },
		]);
		assert.ok(result.includes('animation-duration'));
		assert.ok(result.includes('200ms'));
		assert.ok(result.includes('400ms'));
	});

	it('handles a single animation identical to stringifyAnimation', () => {
		const single = stringifyAnimations([{ name: 'fade', duration: 300, easing: 'ease' }]);
		const viaWrapper = stringifyAnimation({ name: 'fade', duration: 300, easing: 'ease' });
		assert.equal(single, viaWrapper);
	});

	it('omits animation properties that are not set', () => {
		const result = stringifyAnimations([{ name: 'slide' }]);
		assert.ok(!result.includes('animation-duration'));
		assert.ok(!result.includes('animation-timing-function'));
		assert.ok(!result.includes('animation-direction'));
		assert.ok(!result.includes('animation-delay'));
		assert.ok(!result.includes('animation-fill-mode'));
	});

	it('handles an empty array producing only animation-name with empty value', () => {
		// edge case: no animations → animation-name has no entries
		const result = stringifyAnimations([]);
		assert.ok(!result.includes('animation-name'));
	});
});

describe('ViewTransitionStyleSheet', () => {
	it('toString() includes view-transition-name declaration', () => {
		const sheet = new ViewTransitionStyleSheet('astro-abc-1', 'hero');
		const css = sheet.toString();
		assert.ok(
			css.includes('[data-astro-transition-scope="astro-abc-1"] { view-transition-name: hero; }'),
			`unexpected css: ${css}`,
		);
	});

	it('addModern() adds a modern ::view-transition rule inside @layer', () => {
		const sheet = new ViewTransitionStyleSheet('astro-abc-1', 'hero');
		sheet.addModern('old', 'animation: fade-out 300ms;');
		const css = sheet.toString();
		assert.ok(css.includes('@layer astro'), 'expected @layer astro');
		assert.ok(css.includes('::view-transition-old(hero)'), 'expected old selector');
		assert.ok(css.includes('animation: fade-out 300ms;'));
	});

	it('addFallback() adds fallback selectors outside @layer', () => {
		const sheet = new ViewTransitionStyleSheet('astro-abc-1', 'hero');
		sheet.addFallback('old', 'animation: fade-out 300ms;');
		const css = sheet.toString();
		assert.ok(css.includes('[data-astro-transition-fallback="old"]'), 'expected fallback selector');
		assert.ok(css.includes('[data-astro-transition-scope="astro-abc-1"]'));
	});

	it('addAnimationPair() adds both modern and fallback rules for forwards direction', () => {
		const sheet = new ViewTransitionStyleSheet('astro-xyz-1', 'banner');
		sheet.addAnimationPair('forwards', 'old', { name: 'fade-out', duration: 300 });
		const css = sheet.toString();
		assert.ok(css.includes('::view-transition-old(banner)'));
		assert.ok(css.includes('[data-astro-transition-fallback="old"]'));
	});

	it('addAnimationPair() adds [data-astro-transition=back] prefix for backwards direction', () => {
		const sheet = new ViewTransitionStyleSheet('astro-xyz-1', 'banner');
		sheet.addAnimationPair('backwards', 'old', { name: 'slide-out' });
		const css = sheet.toString();
		assert.ok(
			css.includes('[data-astro-transition=back]::view-transition-old(banner)'),
			`expected back prefix: ${css}`,
		);
	});

	it('addAnimationRaw() adds same rule to both modern and fallback', () => {
		const sheet = new ViewTransitionStyleSheet('astro-abc-1', 'hero');
		sheet.addAnimationRaw('new', 'animation: none; mix-blend-mode: normal;');
		const css = sheet.toString();
		assert.ok(css.includes('::view-transition-new(hero)'), 'expected modern rule');
		assert.ok(css.includes('[data-astro-transition-fallback="new"]'), 'expected fallback rule');
	});

	it('produces empty @layer block when no modern rules added', () => {
		const sheet = new ViewTransitionStyleSheet('astro-abc-1', 'hero');
		sheet.addFallback('old', 'animation: none;');
		const css = sheet.toString();
		assert.ok(!css.includes('@layer'), 'should not include @layer when no modern rules');
	});
});
