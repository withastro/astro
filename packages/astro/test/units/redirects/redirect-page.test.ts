import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getEnvironment, setEnvironment } from '../../../dist/core/environment/index.js';
import {
	createComponent,
	maybeRenderHead,
	render,
	renderHead,
} from '../../../dist/runtime/server/index.js';
import { createPage, createRedirect, createTestApp } from '../mocks.ts';

/**
 * Mirrors a `src/pages/3xx.astro` that renders the required meta refresh
 * alongside the redirect details it receives as props.
 */
const RedirectPage = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	const { from, to, status, delay } = Astro.props;
	return render`<html lang="en">
<head>
  <meta http-equiv="refresh" content="${delay};url=${to}">
  <title>Redirecting</title>
${renderHead()}
</head>
${maybeRenderHead()}
<body>
  <p data-from="${from}" data-to="${to}" data-status="${status}" data-delay="${delay}">Moved</p>
</body>
</html>`;
});

/** A `3xx.astro` that throws while rendering. */
const FailingRedirectPage = createComponent(() => {
	throw 'custom 3xx fail';
});

/**
 * Builds an app whose environment opts into redirect-page rendering, the way
 * the build environment does under `experimental.redirectPage`.
 */
function createRedirectPageApp(pages: Parameters<typeof createTestApp>[0]) {
	const app = createTestApp(pages);
	const manifest = (app as any).manifest;
	setEnvironment(manifest, {
		...getEnvironment(manifest),
		rendersRedirectPage: () => true,
	});
	return app;
}

describe('redirects/3xx.astro', () => {
	it('renders the custom page as the redirect body with props', async () => {
		const app = createRedirectPageApp([
			createRedirect({ route: '/old', redirect: '/new' }),
			createPage(RedirectPage, { route: '/3xx' }),
		]);

		const response = await app.render(new Request('https://example.com/old'));

		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new');
		const html = await response.text();
		assert.match(html, /<meta http-equiv="refresh" content="0;url=\/new">/);
		assert.match(html, /data-from="\/old"/);
		assert.match(html, /data-status="301"/);
	});

	it('uses a 2 second delay for 302 redirects', async () => {
		// `computeRedirectStatus` only honours an explicit status when the
		// destination resolved to a route, so the target has to exist.
		const destination = createPage(RedirectPage, { route: '/new' });
		const app = createRedirectPageApp([
			createRedirect({
				route: '/temp',
				redirect: { status: 302, destination: '/new' },
				redirectRoute: destination.routeData,
			}),
			destination,
			createPage(RedirectPage, { route: '/3xx' }),
		]);

		const response = await app.render(new Request('https://example.com/temp'));

		assert.equal(response.status, 302);
		const html = await response.text();
		assert.match(html, /content="2;url=\/new"/);
		assert.match(html, /data-delay="2"/);
	});

	it('leaves the response bodiless when the project has no 3xx.astro', async () => {
		const app = createRedirectPageApp([createRedirect({ route: '/old', redirect: '/new' })]);

		const response = await app.render(new Request('https://example.com/old'));

		assert.equal(response.status, 301);
		assert.equal(response.body, null);
	});

	it('leaves the response bodiless when the environment does not opt in', async () => {
		const app = createTestApp([
			createRedirect({ route: '/old', redirect: '/new' }),
			createPage(RedirectPage, { route: '/3xx' }),
		]);

		const response = await app.render(new Request('https://example.com/old'));

		assert.equal(response.status, 301);
		assert.equal(response.body, null);
	});

	it('falls back to a bodiless redirect when 3xx.astro throws', async () => {
		const app = createRedirectPageApp([
			createRedirect({ route: '/old', redirect: '/new' }),
			createPage(FailingRedirectPage, { route: '/3xx' }),
		]);

		const response = await app.render(new Request('https://example.com/old'));

		assert.equal(response.status, 301);
		assert.equal(response.headers.get('location'), '/new');
		assert.equal(response.body, null);
	});
});
