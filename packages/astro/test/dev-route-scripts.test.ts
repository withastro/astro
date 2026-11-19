import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDevRouteScripts } from '@astrojs/vite-plugin-router/_internal/vite-plugin-routes/index.js';

describe('getDevRouteScripts', () => {
	it('returns empty array when command is build', () => {
		const result = getDevRouteScripts('build', ['astro:scripts/page.js'], ['console.log(1)']);
		assert.deepEqual(result, []);
	});

	it('returns empty array when no scripts are provided in dev mode', () => {
		const result = getDevRouteScripts('dev', [], []);
		assert.deepEqual(result, []);
	});

	it('includes an external entry for each registered page script, in order', () => {
		const result = getDevRouteScripts('dev', ['astro:scripts/page.js', '/abs/toolbar.js'], []);

		assert.deepEqual(result, [
			{ type: 'external', value: '/@id/astro:scripts/page.js' },
			{ type: 'external', value: '/@id//abs/toolbar.js' },
		]);
	});

	it('includes the page scripts, then the inline scripts', () => {
		const result = getDevRouteScripts(
			'dev',
			['astro:scripts/page.js'],
			['console.log("inline1")', 'console.log("inline2")'],
		);

		assert.deepEqual(result, [
			{ type: 'external', value: '/@id/astro:scripts/page.js' },
			{ stage: 'head-inline', children: 'console.log("inline1")' },
			{ stage: 'head-inline', children: 'console.log("inline2")' },
		]);
	});
});
