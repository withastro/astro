import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { sequence } from '../../../dist/core/middleware/index.js';
import { createTestApp, createPage } from '../mocks.ts';
import type { APIContext } from '../../../dist/types/public/context.js';
import type { MiddlewareNext } from '../../../dist/types/public/common.js';

function rewriteTo(target: string) {
	return createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		return Astro.rewrite(target);
	});
}

const targetPage = createComponent(() => render`<h1>Target</h1>`);
const custom500 = createComponent(() => render`<h1>ForbiddenRewrite</h1>`);

describe('SSR-to-prerendered rewrite validation — via Astro.rewrite() (#executeRewrite)', () => {
	it('returns 500 when SSR source rewrites to a prerendered target', async () => {
		// serverLike=true (default), source prerender=false, target prerender=true → ForbiddenRewrite
		const app = createTestApp([
			createPage(rewriteTo('/prerendered'), { route: '/ssr', prerender: false }),
			createPage(targetPage, { route: '/prerendered', prerender: true }),
			createPage(custom500, { route: '/500', component: '500.astro' }),
		]);
		const res = await app.render(new Request('http://example.com/ssr'));
		assert.equal(res.status, 500);
		const $ = cheerio.load(await res.text());
		// App renders the custom 500 page when an AstroError is thrown
		assert.equal($('h1').text(), 'ForbiddenRewrite');
	});

	it('succeeds when SSR source rewrites to an SSR target', async () => {
		// Both SSR → no ForbiddenRewrite
		const app = createTestApp([
			createPage(rewriteTo('/target'), { route: '/source', prerender: false }),
			createPage(targetPage, { route: '/target', prerender: false }),
		]);
		const res = await app.render(new Request('http://example.com/source'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Target');
	});

	it('succeeds when manifest.serverLike is false (static-only build)', async () => {
		// serverLike=false → ForbiddenRewrite condition never fires, even SSR→prerendered is allowed
		const app = createTestApp(
			[
				createPage(rewriteTo('/target'), { route: '/source', prerender: false }),
				createPage(targetPage, { route: '/target', prerender: false }),
			],
			{ serverLike: false },
		);
		const res = await app.render(new Request('http://example.com/source'));
		assert.equal(res.status, 200);
	});
});

describe('SSR-to-prerendered rewrite validation — via sequence()', () => {
	it('returns 500 when chained middleware via sequence() rewrites from SSR to prerendered', async () => {
		const firstMiddleware = async (_ctx: APIContext, next: MiddlewareNext) => next();
		const secondMiddleware = async (ctx: APIContext, next: MiddlewareNext) => {
			if (ctx.url.pathname === '/ssr') {
				return ctx.rewrite('/prerendered');
			}
			return next();
		};

		const app = createTestApp(
			[
				createPage(
					createComponent(() => render`<h1>SSR</h1>`),
					{ route: '/ssr', prerender: false },
				),
				createPage(targetPage, { route: '/prerendered', prerender: true }),
				createPage(custom500, { route: '/500', component: '500.astro' }),
			],
			{ middleware: () => ({ onRequest: sequence(firstMiddleware, secondMiddleware) }) },
		);

		const res = await app.render(new Request('http://example.com/ssr'));
		assert.equal(res.status, 500);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'ForbiddenRewrite');
	});

	it('succeeds when chained middleware via sequence() rewrites from SSR to SSR', async () => {
		const firstMiddleware = async (_ctx: APIContext, next: MiddlewareNext) => next();
		const secondMiddleware = async (ctx: APIContext, next: MiddlewareNext) => {
			if (ctx.url.pathname === '/source') {
				return ctx.rewrite('/target');
			}
			return next();
		};

		const app = createTestApp(
			[
				createPage(
					createComponent(() => render`<h1>Source</h1>`),
					{ route: '/source', prerender: false },
				),
				createPage(targetPage, { route: '/target', prerender: false }),
			],
			{ middleware: () => ({ onRequest: sequence(firstMiddleware, secondMiddleware) }) },
		);

		const res = await app.render(new Request('http://example.com/source'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Target');
	});
});
