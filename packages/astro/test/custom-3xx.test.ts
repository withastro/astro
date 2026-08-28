import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { sessionDrivers } from '../dist/config/entrypoint.js';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

function assertRedirectPage(
	html: string,
	{ status, from, to, locale }: { status: number; from: string; to: string; locale?: string },
) {
	const $ = cheerio.load(html);
	const details = $('#redirect-details');
	assert.equal(details.text(), 'Custom redirect');
	assert.equal(details.attr('data-status'), String(status));
	assert.equal(details.attr('data-from'), from);
	assert.equal(details.attr('data-to'), to);
	if (locale) assert.equal(details.attr('data-locale'), locale);
	assert.equal($('meta[http-equiv="refresh"]').attr('content'), `9;url=${to}`);
	assert.match(html, /color:\s*(?:#010203|rgb\(1,\s*2,\s*3\))/);
}

describe('custom 3xx page in development', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			outDir: './dist/dev/',
			cacheDir: './node_modules/.astro-test/dev/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('renders configured, page, endpoint, and middleware redirects', async () => {
		for (const expected of [
			{ path: '/configured', status: 302, to: '/target' },
			{
				path: '/page-redirect?request=query',
				from: '/page-redirect',
				status: 307,
				to: '/target?source=page',
			},
			{ path: '/endpoint', status: 308, to: '/target?source=endpoint' },
			{ path: '/middleware', status: 303, to: '/target?source=middleware' },
		]) {
			const response = await fixture.fetch(expected.path, { redirect: 'manual' });
			assert.equal(response.status, expected.status);
			assert.equal(response.headers.get('location'), expected.to);
			assert.equal(response.headers.get('x-redirect-template'), 'rendered');
			assert.ok(response.headers.getSetCookie().includes('template-cookie=set'));
			assertRedirectPage(await response.text(), {
				status: expected.status,
				from: expected.from ?? expected.path,
				to: expected.to,
			});
		}
	});

	it('preserves headers and cookies from the original response', async () => {
		const response = await fixture.fetch('/endpoint', { redirect: 'manual' });
		assert.equal(response.headers.get('x-original-header'), 'preserved');
		assert.ok(response.headers.getSetCookie().includes('original=true; Path=/'));
	});

	it('does not expose the internal page as a route', async () => {
		const response = await fixture.fetch('/3xx');
		assert.equal(response.status, 404);
		assert.doesNotMatch(await response.text(), /Custom redirect/);
	});

	it('does not expose the internal page as a rewrite target', async () => {
		const response = await fixture.fetch('/rewrite-internal');
		assert.equal(response.status, 404);
		assert.doesNotMatch(await response.text(), /Custom redirect/);
	});

	it('preserves the original URL when a rewrite redirects', async () => {
		const response = await fixture.fetch('/rewrite-redirect?request=query', {
			redirect: 'manual',
		});
		assert.equal(response.status, 307);
		assertRedirectPage(await response.text(), {
			status: 307,
			from: '/rewrite-redirect?request=query',
			to: '/target?source=page',
		});
	});

	it('does not customize 304 or normalization responses', async () => {
		const notModified = await fixture.fetch('/not-modified', { redirect: 'manual' });
		assert.equal(notModified.status, 304);
		assert.equal(notModified.headers.get('x-redirect-template'), null);

		const normalized = await fixture.fetch('/target//', { redirect: 'manual' });
		assert.ok(normalized.status >= 300 && normalized.status < 400);
		assert.equal(normalized.headers.get('x-redirect-template'), null);
	});
});

describe('custom 3xx page with i18n routing', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			outDir: './dist/i18n/',
			cacheDir: './node_modules/.astro-test/i18n/',
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'fr'],
				fallback: { fr: 'en' },
				routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
			},
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('renders locale redirects with the custom page', async () => {
		const response = await fixture.fetch('/', { redirect: 'manual' });
		assert.equal(response.status, 302);
		assert.equal(response.headers.get('location'), '/en/');
		assertRedirectPage(await response.text(), { status: 302, from: '/', to: '/en/' });
	});

	it('preserves the redirect locale in the custom page', async () => {
		const response = await fixture.fetch('/fr/page-redirect', { redirect: 'manual' });
		assert.equal(response.status, 307);
		assertRedirectPage(await response.text(), {
			status: 307,
			from: '/fr/page-redirect',
			to: '/fr/target?source=page',
			locale: 'fr',
		});
	});
});

describe('custom 3xx page in static builds', () => {
	let fixture: Fixture;
	const setupRoutes: string[] = [];
	const resolvedRoutes: string[] = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			outDir: './dist/static/',
			cacheDir: './node_modules/.astro-test/static/',
			build: { inlineStylesheets: 'always' },
			integrations: [
				{
					name: 'inspect-routes',
					hooks: {
						'astro:route:setup': ({ route }) => {
							setupRoutes.push(route.component);
						},
						'astro:routes:resolved': ({ routes }) => {
							resolvedRoutes.push(...routes.map((route) => route.entrypoint));
						},
					},
				},
			],
		});
		await fixture.build();
	});

	it('writes the custom page for prerendered redirects', async () => {
		for (const expected of [
			{ file: '/configured/index.html', status: 302, from: '/configured/', to: '/target' },
			{
				file: '/page-redirect/index.html',
				status: 307,
				from: '/page-redirect/',
				to: '/target?source=page',
			},
			{
				file: '/middleware/index.html',
				status: 303,
				from: '/middleware/',
				to: '/target?source=middleware',
			},
		]) {
			assertRedirectPage(await fixture.readFile(expected.file), expected);
		}
	});

	it('does not emit the internal page', () => {
		assert.equal(fixture.pathExists('/3xx/index.html'), false);
	});

	it('does not expose the internal page to route hooks', () => {
		assert.equal(setupRoutes.includes('src/pages/3xx.astro'), false);
		assert.equal(resolvedRoutes.includes('src/pages/3xx.astro'), false);
	});
});

describe('custom 3xx page in server builds', () => {
	let app: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/server/',
			cacheDir: './node_modules/.astro-test/server/',
			build: { inlineStylesheets: 'always' },
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('loads the custom page and its assets from the production manifest', async () => {
		const response = await app.render(new Request('http://example.com/endpoint?request=query'));
		assert.equal(response.status, 308);
		assert.equal(response.headers.get('location'), '/target?source=endpoint');
		assert.equal(response.headers.get('x-original-header'), 'preserved');
		assert.equal(response.headers.get('x-redirect-template'), 'rendered');
		assertRedirectPage(await response.text(), {
			status: 308,
			from: '/endpoint?request=query',
			to: '/target?source=endpoint',
		});
	});

	it('does not expose the internal page as a rewrite target', async () => {
		const response = await app.render(new Request('http://example.com/rewrite-internal'));
		assert.equal(response.status, 404);
		assert.doesNotMatch(await response.text(), /Custom redirect/);
	});

	it('preserves the original URL when a rewrite redirects', async () => {
		const response = await app.render(
			new Request('http://example.com/rewrite-redirect?request=query'),
		);
		assert.equal(response.status, 307);
		assertRedirectPage(await response.text(), {
			status: 307,
			from: '/rewrite-redirect?request=query',
			to: '/target?source=page',
		});
	});

	it('rejects cross-origin form submissions before rendering a configured redirect', async () => {
		const response = await app.render(
			new Request('http://example.com/configured', {
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					origin: 'https://attacker.example',
				},
				body: 'value=unsafe',
			}),
		);
		assert.equal(response.status, 403);
		assert.equal(response.headers.get('x-redirect-template'), null);
	});
});

describe('custom 3xx page with sessions', () => {
	let app: App;

	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/custom-3xx/',
			output: 'server',
			adapter: testAdapter(),
			session: { driver: sessionDrivers.fs() } as never,
			outDir: './dist/session/',
			cacheDir: './node_modules/.astro-test/session/',
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('shares and persists session state from the redirect response', async () => {
		const response = await app.render(new Request('http://example.com/endpoint?session=write'));
		const html = await response.text();
		assert.equal(cheerio.load(html)('#redirect-details').attr('data-session'), 'endpoint-template');

		const sessionCookie = [...app.setCookieHeaders(response)].find((cookie) =>
			cookie.startsWith('astro-session='),
		);
		assert.ok(sessionCookie);
		const persisted = await app.render(
			new Request('http://example.com/endpoint?session=read', {
				headers: { cookie: sessionCookie.split(';', 1)[0] },
			}),
		);
		assert.equal(await persisted.text(), 'endpoint-template');
	});
});
