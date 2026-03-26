// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractDirectives } from '../../../dist/runtime/server/hydration.js';

// Minimal clientDirectives map matching what Astro registers by default
const clientDirectives = new Map([
	['load', ''],
	['idle', ''],
	['visible', ''],
	['media', ''],
	['only', ''],
]);

describe('extractDirectives', () => {
	it('returns empty hydration and all props when no client: directives present', () => {
		const result = extractDirectives({ title: 'Hello', count: 42 }, clientDirectives);
		assert.equal(result.hydration, null);
		assert.deepEqual(result.props, { title: 'Hello', count: 42 });
		assert.equal(result.isPage, false);
	});

	it('extracts client:load directive', () => {
		const result = extractDirectives(
			{
				'client:load': '',
				'client:component-path': '/src/Button.jsx',
				'client:component-export': 'default',
				title: 'Hello',
			},
			clientDirectives,
		);
		assert.ok(result.hydration !== null);
		assert.equal(result.hydration.directive, 'load');
		assert.equal(result.hydration.value, '');
		assert.equal(result.hydration.componentUrl, '/src/Button.jsx');
		assert.equal(result.hydration.componentExport.value, 'default');
		assert.deepEqual(result.props, { title: 'Hello' });
	});

	it('extracts client:idle directive', () => {
		const result = extractDirectives(
			{
				'client:idle': '',
				'client:component-path': '/src/Widget.jsx',
				'client:component-export': 'Widget',
			},
			clientDirectives,
		);
		assert.equal(result.hydration?.directive, 'idle');
	});

	it('extracts client:visible directive', () => {
		const result = extractDirectives(
			{
				'client:visible': { rootMargin: '200px' },
				'client:component-path': '/src/Component.jsx',
				'client:component-export': 'default',
			},
			clientDirectives,
		);
		assert.equal(result.hydration?.directive, 'visible');
		assert.deepEqual(result.hydration?.value, { rootMargin: '200px' });
	});

	it('extracts client:media directive with query value', () => {
		const result = extractDirectives(
			{
				'client:media': '(max-width: 768px)',
				'client:component-path': '/src/Nav.jsx',
				'client:component-export': 'default',
			},
			clientDirectives,
		);
		assert.equal(result.hydration?.directive, 'media');
		assert.equal(result.hydration?.value, '(max-width: 768px)');
	});

	it('extracts client:only directive and sets componentUrl', () => {
		const result = extractDirectives(
			{
				'client:only': 'react',
				'client:component-path': '/src/ReactComp.jsx',
				'client:component-export': 'default',
			},
			clientDirectives,
		);
		assert.equal(result.hydration?.directive, 'only');
		assert.equal(result.hydration?.value, 'react');
	});

	it('separates client: props from regular props', () => {
		const result = extractDirectives(
			{
				'client:load': '',
				'client:component-path': '/src/Btn.jsx',
				'client:component-export': 'default',
				class: 'btn',
				disabled: true,
			},
			clientDirectives,
		);
		assert.deepEqual(result.props, { class: 'btn', disabled: true });
		assert.ok(!('client:load' in result.props));
	});

	it('sets isPage = true when server:root is present', () => {
		const result = extractDirectives({ 'server:root': true }, clientDirectives);
		assert.equal(result.isPage, true);
	});

	it('handles data-astro-transition-scope: included in props but excluded from propsWithoutTransitionAttributes', () => {
		const result = extractDirectives(
			{ 'data-astro-transition-scope': 'astro-abc-1', title: 'Hello' },
			clientDirectives,
		);
		assert.ok('data-astro-transition-scope' in result.props);
		assert.ok(!('data-astro-transition-scope' in result.propsWithoutTransitionAttributes));
		assert.ok('title' in result.propsWithoutTransitionAttributes);
	});

	it('handles data-astro-transition-persist: excluded from propsWithoutTransitionAttributes', () => {
		const result = extractDirectives(
			{ 'data-astro-transition-persist': 'hero', class: 'img' },
			clientDirectives,
		);
		assert.ok('data-astro-transition-persist' in result.props);
		assert.ok(!('data-astro-transition-persist' in result.propsWithoutTransitionAttributes));
	});

	it('copies symbol props to both props and propsWithoutTransitionAttributes', () => {
		const sym = Symbol('test');
		const result = extractDirectives({ [sym]: 'symbol-value' }, clientDirectives);
		assert.equal(result.props[sym], 'symbol-value');
		assert.equal(result.propsWithoutTransitionAttributes[sym], 'symbol-value');
	});

	it('throws for an invalid hydration directive', () => {
		assert.throws(
			() => extractDirectives({ 'client:unknown': '' }, clientDirectives),
			(err) => {
				assert.ok(err.message.includes('invalid hydration directive'));
				assert.ok(err.message.includes('client:unknown'));
				return true;
			},
		);
	});
});
