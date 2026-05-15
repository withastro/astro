import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterPluginsForTempServer } from '../../dist/core/integration/index.js';

describe('filterPluginsForTempServer', () => {
	it('returns empty array for undefined plugins', () => {
		const result = filterPluginsForTempServer(undefined);
		assert.deepEqual(result, []);
	});

	it('returns empty array for empty plugins', () => {
		const result = filterPluginsForTempServer([]);
		assert.deepEqual(result, []);
	});

	it('preserves non-Cloudflare plugins', () => {
		const plugins = [
			{ name: 'astro:db' },
			{ name: 'virtual:astro:manifest' },
			{ name: 'astro:build' },
		];
		const result = filterPluginsForTempServer(plugins);
		assert.equal(result.length, 3);
	});

	it('filters out vite-plugin-cloudflare and all its sub-plugins', () => {
		const plugins = [
			{ name: 'astro:db' },
			{ name: 'vite-plugin-cloudflare' },
			{ name: 'vite-plugin-cloudflare:config' },
			{ name: 'vite-plugin-cloudflare:dev' },
			{ name: 'vite-plugin-cloudflare:preview' },
			{ name: 'vite-plugin-cloudflare:virtual-modules' },
			{ name: 'virtual:astro:manifest' },
		];
		const result = filterPluginsForTempServer(plugins);
		assert.equal(result.length, 2);
		assert.deepEqual(
			result.map((p) => p.name),
			['astro:db', 'virtual:astro:manifest'],
		);
	});

	it('handles nested plugin arrays (flattening)', () => {
		const plugins = [
			[{ name: 'astro:db' }],
			[{ name: 'vite-plugin-cloudflare' }, { name: 'vite-plugin-cloudflare:dev' }],
			{ name: 'astro:build' },
		];
		const result = filterPluginsForTempServer(plugins);
		assert.equal(result.length, 2);
		assert.deepEqual(
			result.map((p) => p.name),
			['astro:db', 'astro:build'],
		);
	});

	it('handles null/undefined/false entries in plugin array', () => {
		const plugins = [
			null,
			undefined,
			false,
			{ name: 'astro:db' },
			{ name: 'vite-plugin-cloudflare' },
		];
		const result = filterPluginsForTempServer(plugins);
		// null/undefined/false are preserved (Vite handles them), only cloudflare plugins are removed
		assert.equal(result.length, 4);
		const named = result.filter((p) => p && typeof p === 'object' && 'name' in p);
		assert.deepEqual(
			named.map((p) => p.name),
			['astro:db'],
		);
	});
});
