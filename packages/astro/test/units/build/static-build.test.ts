import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeAstroPageEntryPointFileName } from '../../../dist/core/build/static-build.js';
import { cleanChunkName, getTimeStat } from '../../../dist/core/build/util.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

describe('astro/src/core/build', () => {
	describe('getTimeStat', () => {
		it('formats sub-second durations in milliseconds', () => {
			assert.equal(getTimeStat(0, 0), '0ms');
			assert.equal(getTimeStat(0, 500), '500ms');
			assert.equal(getTimeStat(0, 999), '999ms');
		});

		it('rounds milliseconds to the nearest integer', () => {
			assert.equal(getTimeStat(0, 499.5), '500ms');
			assert.equal(getTimeStat(0, 0.4), '0ms');
		});

		it('formats durations >= 1s and < 60s in seconds with two decimals', () => {
			assert.equal(getTimeStat(0, 1000), '1.00s');
			assert.equal(getTimeStat(0, 1500), '1.50s');
			assert.equal(getTimeStat(0, 59999), '60.00s');
		});

		it('formats durations >= 60s with mutes and rounded seconds', () => {
			assert.equal(getTimeStat(0, 60000), '1m 0s');
			assert.equal(getTimeStat(0, 90000), '1m 30s');
			assert.equal(getTimeStat(0, 125400), '2m 5s');
			assert.equal(getTimeStat(0, 600000), '10m 0s');
			assert.equal(getTimeStat(0, 754000), '12m 34s');
		});

		it('works with non-zero start times', () => {
			assert.equal(getTimeStat(1000, 1500), '500ms');
			assert.equal(getTimeStat(5000, 8000), '3.00s');
			assert.equal(getTimeStat(1000, 91000), '1m 30s');
		});
	});

	describe('cleanChunkName', () => {
		it('passes through safe names unchanged', () => {
			assert.equal(cleanChunkName('page'), 'page');
			assert.equal(cleanChunkName('my-component'), 'my-component');
			assert.equal(cleanChunkName('pages/index'), 'pages/index');
			assert.equal(cleanChunkName('chunk_abc123'), 'chunk_abc123');
		});

		it('replaces ! and ~ characters', () => {
			assert.equal(cleanChunkName('page.!{005}'), 'page.__005_');
			assert.equal(cleanChunkName('~something'), '_something');
		});

		it('replaces other unsafe characters', () => {
			assert.equal(cleanChunkName('name@scope'), 'name_scope');
			assert.equal(cleanChunkName('file#hash'), 'file_hash');
		});

		it('replaces % character', () => {
			assert.equal(cleanChunkName('chunk%name'), 'chunk_name');
		});
	});

	describe('makeAstroPageEntryPointFileName', () => {
		const routes: RouteData[] = [
			{
				route: '/',
				component: 'src/pages/index.astro',
				pathname: '/',
			},
			{
				route: '/injected',
				component: '../node_modules/my-dep/injected.astro',
				pathname: '/injected',
			},
			{
				route: '/injected-workspace',
				component: '../../packages/demo/[...all].astro',
				pathname: undefined,
			},
			{
				route: '/blog/[year]/[...slug]',
				component: 'src/pages/blog/[year]/[...slug].astro',
				pathname: undefined,
			},
		] as RouteData[];

		it('handles local pages', async () => {
			const input = '@astro-page:src/pages/index@_@astro';
			const output = 'pages/index.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		it('handles dynamic pages', async () => {
			const input = '@astro-page:src/pages/blog/[year]/[...slug]@_@astro';
			const output = 'pages/blog/_year_/_---slug_.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		it('handles node_modules pages', async () => {
			const input = '@astro-page:../node_modules/my-dep/injected@_@astro';
			const output = 'pages/injected.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		// Fix #7561
		it('handles local workspace pages', async () => {
			const input = '@astro-page:../../packages/demo/[...all]@_@astro';
			const output = 'pages/injected-workspace.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});
	});
});
