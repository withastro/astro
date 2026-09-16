import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDevRouteScripts } from '../dist/vite-plugin-routes/index.js';

type RouteScripts = Parameters<typeof getDevRouteScripts>[1];

describe('getDevRouteScripts', () => {
	it('returns empty array when command is build', () => {
		const scripts: RouteScripts = [{ stage: 'page', content: 'console.log("page")' }];
		const result = getDevRouteScripts('build', scripts);
		assert.deepEqual(result, []);
	});

	it('returns empty array when no scripts are provided in dev mode', () => {
		const result = getDevRouteScripts('dev', []);
		assert.deepEqual(result, []);
	});

	it('includes external page script entry when page-stage scripts exist', () => {
		const scripts: RouteScripts = [{ stage: 'page', content: 'import "alpinejs"' }];
		const result = getDevRouteScripts('dev', scripts);

		assert.equal(result.length, 1);
		assert.deepEqual(result[0], {
			type: 'external',
			value: '/@id/astro:scripts/page.js',
		});
	});

	it('collapses multiple page scripts into a single external entry', () => {
		const scripts: RouteScripts = [
			{ stage: 'page', content: 'import "alpinejs"' },
			{ stage: 'page', content: 'import "other"' },
		];
		const result = getDevRouteScripts('dev', scripts);

		const pageEntries = result.filter((s) => 'type' in s && s.type === 'external');
		assert.equal(pageEntries.length, 1);
	});

	it('includes head-inline scripts with their content', () => {
		const scripts: RouteScripts = [{ stage: 'head-inline', content: 'console.log("inline")' }];
		const result = getDevRouteScripts('dev', scripts);

		assert.equal(result.length, 1);
		assert.deepEqual(result[0], {
			stage: 'head-inline',
			children: 'console.log("inline")',
		});
	});

	it('includes both page and head-inline scripts together', () => {
		const scripts: RouteScripts = [
			{ stage: 'page', content: 'import "alpinejs"' },
			{ stage: 'head-inline', content: 'console.log("inline1")' },
			{ stage: 'head-inline', content: 'console.log("inline2")' },
		];
		const result = getDevRouteScripts('dev', scripts);

		assert.equal(result.length, 3);
		assert.deepEqual(result[0], {
			type: 'external',
			value: '/@id/astro:scripts/page.js',
		});
		assert.deepEqual(result[1], {
			stage: 'head-inline',
			children: 'console.log("inline1")',
		});
		assert.deepEqual(result[2], {
			stage: 'head-inline',
			children: 'console.log("inline2")',
		});
	});

	it('ignores before-hydration and page-ssr stage scripts', () => {
		const scripts: RouteScripts = [
			{ stage: 'before-hydration', content: 'console.log("hydration")' },
			{ stage: 'page-ssr', content: 'console.log("ssr")' },
		];
		const result = getDevRouteScripts('dev', scripts);

		assert.deepEqual(result, []);
	});

	it('ignores non-relevant stages while still collecting page and head-inline', () => {
		const scripts: RouteScripts = [
			{ stage: 'before-hydration', content: 'console.log("hydration")' },
			{ stage: 'page', content: 'import "alpinejs"' },
			{ stage: 'page-ssr', content: 'console.log("ssr")' },
			{ stage: 'head-inline', content: 'window.__config = {}' },
		];
		const result = getDevRouteScripts('dev', scripts);

		assert.equal(result.length, 2);
		assert.deepEqual(result[0], {
			type: 'external',
			value: '/@id/astro:scripts/page.js',
		});
		assert.deepEqual(result[1], {
			stage: 'head-inline',
			children: 'window.__config = {}',
		});
	});
});
