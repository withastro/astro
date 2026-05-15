import assert from 'node:assert';
import test, { describe } from 'node:test';
import { filterPluginsForTempServer } from '../../dist/core/integration/index.js';

describe('filterPluginsForTempServer', () => {
	test('removes vite-plugin-cloudflare plugins', () => {
		const plugins = [
			{ name: 'astro:build' },
			{ name: 'vite-plugin-cloudflare' },
			{ name: 'vite-plugin-cloudflare:dev' },
			{ name: 'vite-plugin-cloudflare:config' },
			{ name: 'astro:assets' },
		];
		const filtered = filterPluginsForTempServer(plugins);
		const names = (filtered ?? []).flatMap((p) =>
			p && typeof p === 'object' && 'name' in p ? [p.name] : [],
		);
		assert.deepStrictEqual(names, ['astro:build', 'astro:assets']);
	});

	test('preserves all plugins when no cloudflare plugins present', () => {
		const plugins = [
			{ name: 'astro:build' },
			{ name: 'astro:assets' },
			{ name: '@astrojs/react' },
		];
		const filtered = filterPluginsForTempServer(plugins);
		const names = (filtered ?? []).flatMap((p) =>
			p && typeof p === 'object' && 'name' in p ? [p.name] : [],
		);
		assert.deepStrictEqual(names, ['astro:build', 'astro:assets', '@astrojs/react']);
	});

	test('handles undefined plugins', () => {
		const filtered = filterPluginsForTempServer(undefined);
		assert.deepStrictEqual(filtered, []);
	});

	test('handles empty plugins array', () => {
		const filtered = filterPluginsForTempServer([]);
		assert.deepStrictEqual(filtered, []);
	});

	test('handles nested plugin arrays (flattens)', () => {
		const plugins = [
			[{ name: 'astro:build' }, { name: 'vite-plugin-cloudflare:rsc' }],
			{ name: 'astro:assets' },
		];
		const filtered = filterPluginsForTempServer(plugins);
		const names = (filtered ?? []).flatMap((p) =>
			p && typeof p === 'object' && 'name' in p ? [p.name] : [],
		);
		assert.deepStrictEqual(names, ['astro:build', 'astro:assets']);
	});

	test('handles null/falsy entries in plugins array', () => {
		const plugins = [null, undefined, false, { name: 'astro:build' }] as const;
		const filtered = filterPluginsForTempServer(plugins as any);
		assert.strictEqual((filtered ?? []).length, 4); // null, undefined, false pass the name check
	});

	test('preserves non-cloudflare adapter plugins', () => {
		const plugins = [
			{ name: '@astrojs/cloudflare:cf-imports' },
			{ name: '@astrojs/cloudflare:environment' },
			{ name: 'vite-plugin-cloudflare' },
			{ name: 'vite-plugin-cloudflare:dev' },
		];
		const filtered = filterPluginsForTempServer(plugins);
		const names = (filtered ?? []).flatMap((p) =>
			p && typeof p === 'object' && 'name' in p ? [p.name] : [],
		);
		// Only vite-plugin-cloudflare* are removed; @astrojs/cloudflare:* are kept
		assert.deepStrictEqual(names, [
			'@astrojs/cloudflare:cf-imports',
			'@astrojs/cloudflare:environment',
		]);
	});
});
