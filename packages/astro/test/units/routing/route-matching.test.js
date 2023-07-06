// @ts-check
import { createFs, createRequestAndResponse, defaultLogging } from '../test-utils.js';
import { createRouteManifest, matchAllRoutes } from '../../../dist/core/routing/index.js';
import { fileURLToPath } from 'url';
import { createViteLoader } from '../../../dist/core/module-loader/vite.js';
import { createDevelopmentEnvironment } from '../../../dist/core/render/dev/environment.js';
import { expect } from 'chai';
import { createContainer } from '../../../dist/core/dev/container.js';
import * as cheerio from 'cheerio';
import testAdapter from '../../test-adapter.js';
import { getSortedPreloadedMatches } from '../../../dist/prerender/routing.js';

const root = new URL('../../fixtures/alias/', import.meta.url);
const fileSystem = {
	'/src/pages/[serverDynamic].astro': `
		---
		export const prerender = false;
		---
		<p>Server dynamic route! slug:{Astro.params.serverDynamic}</p>
		`,

	'/src/pages/[xStaticDynamic].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticDynamic: "static-dynamic-route-here",
					},
				},
			];
		}
		---
		<p>Prerendered dynamic route!</p>
		`,
	'/src/pages/[aStaticDynamic].astro': `
			---
			export function getStaticPaths() {
				return [
					{
						params: {
							aStaticDynamic: "another-static-dynamic-route-here",
						},
					},
				];
			}
			---
			<p>Another prerendered dynamic route!</p>
	`,
	'/src/pages/[...serverRest].astro': `
	---
	export const prerender = false;
	---
	<p>Server rest route! slug:{Astro.params.serverRest}</p>
	`,
	'/src/pages/[...xStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticRest: undefined,
					},
				},
			];
		}
		---
		<p>Prerendered rest route!</p>
`,
	'/src/pages/[...aStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						aStaticRest: "another/static-rest-route-here",
					},
				},
			];
		}
		---
		<p>Another prerendered rest route!</p>
`,

	'/src/pages/nested/[...serverRest].astro': `
	---
	export const prerender = false;
	---
	<p>Nested server rest route! slug: {Astro.params.serverRest}</p>
	`,
	'/src/pages/nested/[...xStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticRest: undefined,
					},
				},
			];
		}
		---
		<p>Nested prerendered rest route!</p>
`,
	'/src/pages/nested/[...aStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						aStaticRest: "another-nested-static-dynamic-rest-route-here",
					},
				},
			];
		}
		---
		<p>Another nested prerendered rest route!</p>
`,
};

describe('Route matching', () => {
	let env;
	let manifest;
	let container;
	let settings;

	before(async () => {
		const fs = createFs(fileSystem, root);
		container = await createContainer({
			fs,
			root,
			userConfig: {
				trailingSlash: 'never',
				output: 'hybrid',
				adapter: testAdapter(),
			},
		});
		settings = container.settings;

		const loader = createViteLoader(container.viteServer);
		env = createDevelopmentEnvironment(container.settings, defaultLogging, loader);
		manifest = createRouteManifest(
			{
				cwd: fileURLToPath(root),
				settings,
				fsMod: fs,
			},
			defaultLogging
		);
	});

	after(async () => {
		await container.close();
	});

	describe('Matched routes', () => {
		it('should be sorted correctly', async () => {
			const matches = matchAllRoutes('/try-matching-a-route', manifest);
			const preloadedMatches = await getSortedPreloadedMatches({ env, matches, settings });
			const sortedRouteNames = preloadedMatches.map((match) => match.route.route);

			expect(sortedRouteNames).to.deep.equal([
				'/[astaticdynamic]',
				'/[xstaticdynamic]',
				'/[serverdynamic]',
				'/[...astaticrest]',
				'/[...xstaticrest]',
				'/[...serverrest]',
			]);
		});
		it('nested should be sorted correctly', async () => {
			const matches = matchAllRoutes('/nested/try-matching-a-route', manifest);
			const preloadedMatches = await getSortedPreloadedMatches({ env, matches, settings });
			const sortedRouteNames = preloadedMatches.map((match) => match.route.route);

			expect(sortedRouteNames).to.deep.equal([
				'/nested/[...astaticrest]',
				'/nested/[...xstaticrest]',
				'/nested/[...serverrest]',
				'/[...astaticrest]',
				'/[...xstaticrest]',
				'/[...serverrest]',
			]);
		});
	});

	describe('Request', () => {
		it('should correctly match a static dynamic route I', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/static-dynamic-route-here',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Prerendered dynamic route!');
		});

		it('should correctly match a static dynamic route II', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/another-static-dynamic-route-here',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Another prerendered dynamic route!');
		});

		it('should correctly match a server dynamic route', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/a-random-slug-was-matched',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Server dynamic route! slug:a-random-slug-was-matched');
		});

		it('should correctly match a static rest route I', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Prerendered rest route!');
		});

		it('should correctly match a static rest route II', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/another/static-rest-route-here',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Another prerendered rest route!');
		});

		it('should correctly match a nested static rest route index', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/nested',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Nested prerendered rest route!');
		});

		it('should correctly match a nested static rest route', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/nested/another-nested-static-dynamic-rest-route-here',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Another nested prerendered rest route!');
		});

		it('should correctly match a nested server rest route', async () => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/nested/a-random-slug-was-matched',
			});
			container.handle(req, res);

			const html = await text();
			const $ = cheerio.load(html);
			expect($('p').text()).to.equal('Nested server rest route! slug: a-random-slug-was-matched');
		});
	});
});
