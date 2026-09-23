import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generatePages } from '../../../dist/core/build/generate.js';
import { createBuildInternals } from '../../../dist/core/build/internal.js';
import {
	BuildProfile,
	printBuildProfileSummary,
	summarizeRoutes,
} from '../../../dist/core/build/profile.js';
import type { PageStatus } from '../../../dist/core/build/profile.js';
import type { PageBuildData } from '../../../dist/core/build/types.js';
import { createRouteData } from '../mocks.ts';
import { SpyLogger } from '../test-utils.ts';
import { createMockPrerenderer, createStaticBuildOptions } from './test-helpers.ts';

const environment = {
	astroVersion: 'test',
	buildOutput: 'static',
	adapter: undefined,
	prerenderer: 'astro:default',
	concurrency: 1,
};

function page(
	route: string,
	pathname: string,
	durationMs: number,
	status: PageStatus = 'rendered',
) {
	return { route, pathname, component: `src/pages${route}.astro`, durationMs, status };
}

describe('summarizeRoutes', () => {
	it('ranks routes by total render time, not by their slowest page', () => {
		const pages = [
			page('/heavy', '/heavy', 700),
			...Array.from({ length: 100 }, (_, i) => page('/items/[id]', `/items/${i}`, 20)),
		];

		const [first, second] = summarizeRoutes(pages);

		assert.equal(first.route, '/items/[id]');
		assert.equal(first.totalMs, 2000);
		assert.equal(first.paths, 100);
		assert.equal(second.route, '/heavy');
		assert.equal(second.maxMs, 700);
	});

	it('excludes cached pages from render statistics but counts them', () => {
		const [route] = summarizeRoutes([
			page('/blog/[slug]', '/blog/a', 50),
			page('/blog/[slug]', '/blog/b', 10),
			page('/blog/[slug]', '/blog/c', 1, 'cached'),
			page('/blog/[slug]', '/blog/d', 1, 'restored'),
		]);

		assert.equal(route.paths, 4);
		assert.equal(route.rendered, 2);
		assert.equal(route.cached, 2);
		assert.equal(route.totalMs, 60);
		assert.equal(route.avgMs, 30);
		assert.equal(route.maxMs, 50);
		assert.equal(route.slowestPath, '/blog/a');
	});

	it('reports the 95th percentile render time', () => {
		const pages = Array.from({ length: 20 }, (_, i) => page('/p/[n]', `/p/${i}`, i + 1));
		const [route] = summarizeRoutes(pages);
		assert.equal(route.p95Ms, 19);
	});
});

describe('BuildProfile', () => {
	it('produces a versioned report with phases, hooks, pages, and images', () => {
		const profile = new BuildProfile();
		const end = profile.phase('Render pages');
		end();
		profile.recordHook('my-integration', 'astro:build:done', 12.345);
		profile.recordPage(page('/', '/', 3));
		profile.recordImage({ src: '/_astro/a.png', transforms: 2, durationMs: 4 });

		const report = profile.toReport(environment);

		assert.equal(report.version, 1);
		assert.equal(report.environment.astroVersion, 'test');
		assert.deepEqual(
			report.phases.map((p) => p.name),
			['Render pages'],
		);
		assert.deepEqual(report.hooks, [
			{ integration: 'my-integration', hook: 'astro:build:done', durationMs: 12.35 },
		]);
		assert.equal(report.routes[0].route, '/');
		assert.equal(report.images.length, 1);
	});
});

describe('printBuildProfileSummary', () => {
	it('lists phases, slowest routes, and combines repeated hooks', () => {
		const profile = new BuildProfile();
		profile.recordPage(page('/items/[id]', '/items/1', 20));
		profile.recordHook('slow', 'astro:routes:resolved', 3);
		profile.recordHook('slow', 'astro:routes:resolved', 4);
		profile.recordHook('fast', 'astro:config:done', 0.1);
		const logger = new SpyLogger();

		printBuildProfileSummary(profile.toReport(environment), '/tmp/build-profile.json', logger);

		const output = logger.logs.map((l) => l.message).join('\n');
		assert.match(output, /\/items\/\[id\]/);
		assert.match(output, /7ms {2}slow/);
		assert.doesNotMatch(output, /fast/);
		assert.match(output, /\/tmp\/build-profile\.json/);
	});
});

describe('generatePages with a build profile', () => {
	it('records a page entry and the render phases for each generated path', async () => {
		const aboutRoute = createRouteData({ route: '/about', prerender: true });
		const options = await createStaticBuildOptions();
		const profile = new BuildProfile();
		options.allPages = {};
		Object.assign(options.settings, {
			buildProfile: profile,
			prerenderer: createMockPrerenderer(
				{ '/about': '<p>about</p>' },
				{ staticPaths: [{ pathname: '/about', route: aboutRoute }] },
			),
		});
		Object.assign(options.settings.config, {
			integrations: [],
			experimental: {},
			build: { ...options.settings.config.build, concurrency: 1 },
		});
		const internals = createBuildInternals();
		internals.pagesByKeys.set('about', { route: aboutRoute } as PageBuildData);

		await generatePages(options, internals, new URL('prerender/', options.settings.config.outDir));

		const report = profile.toReport(environment);
		assert.deepEqual(
			report.pages.map((p) => [p.pathname, p.route, p.status]),
			[['/about', '/about', 'rendered']],
		);
		const phases = report.phases.map((p) => p.name);
		assert.ok(phases.includes('getStaticPaths'));
		assert.ok(phases.includes('Render pages'));
	});
});
