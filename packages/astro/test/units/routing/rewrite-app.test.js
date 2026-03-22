// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { sequence } from '../../../dist/core/middleware/index.js';
import { createTestApp, createPage } from '../mocks.js';
import { staticPart, dynamicPart, spreadPart } from './test-helpers.js';

const indexPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	const auth = Astro.locals.auth || '';
	return render`<h1>Index</h1><p>${auth}</p><h2>Origin: ${Astro.originPathname}</h2>`;
});

function rewriteTo(target) {
	return createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return Astro.rewrite(target);
	});
}

const postBPage = createComponent(async (result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	let email = '';
	if (Astro.request.method === 'POST') {
		const data = await Astro.request.json();
		email = data.email;
	}
	return render`<h1>Post B</h1><h2>${email}</h2>`;
});

describe('Rewrites via App - basic', () => {
	const app = createTestApp([
		createPage(rewriteTo('/'), { route: '/reroute' }),
		createPage(indexPage, { route: '/', isIndex: true }),
	]);

	it('rewrite to / renders the index page', async () => {
		const res = await app.render(new Request('http://example.com/reroute'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});

	it('preserves originPathname after rewrite', async () => {
		const res = await app.render(new Request('http://example.com/reroute'));
		const $ = cheerio.load(await res.text());
		assert.match($('h2').text(), /\/reroute/);
	});
});

describe('Rewrites via App - dynamic and spread routes', () => {
	const app = createTestApp([
		createPage(rewriteTo('/'), {
			route: '/dynamic/[id]',
			segments: [[staticPart('dynamic')], [dynamicPart('id')]],
			pathname: undefined,
		}),
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(rewriteTo('/'), {
			route: '/spread/[...slug]',
			segments: [[staticPart('spread')], [spreadPart('...slug')]],
			pathname: undefined,
		}),
	]);

	it('rewrite from dynamic route renders index', async () => {
		const res = await app.render(new Request('http://example.com/dynamic/hello'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});

	it('rewrite from spread route renders index', async () => {
		const res = await app.render(new Request('http://example.com/spread/hello'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});

	it('unmatched route returns 404', async () => {
		const res = await app.render(new Request('http://example.com/blog/oops'));
		assert.equal(res.status, 404);
	});
});

describe('Rewrites via App - non-ASCII paths', () => {
	const app = createTestApp([
		createPage(rewriteTo('/'), {
			route: '/redirected/[slug]',
			segments: [[staticPart('redirected')], [dynamicPart('slug')]],
			pathname: undefined,
		}),
		createPage(indexPage, { route: '/', isIndex: true }),
	]);

	it('rewrite from non-ASCII path renders index', async () => {
		const res = await app.render(new Request('http://example.com/redirected/h%C3%A9llo'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});
});

describe('Rewrites via App - POST body forwarding', () => {
	const app = createTestApp([
		createPage(rewriteTo('/post/post-b'), { route: '/post/post-a' }),
		createPage(postBPage, { route: '/post/post-b' }),
	]);

	it('passes POST body from rewrite source to target', async () => {
		const res = await app.render(
			new Request('http://example.com/post/post-a', {
				method: 'POST',
				body: JSON.stringify({ email: 'example@example.com' }),
				headers: { 'content-type': 'application/json' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Post B');
		assert.match($('h2').text(), /example@example.com/);
	});
});

describe('Rewrites via App - URL and Request payloads', () => {
	const app = createTestApp([
		createPage(
			createComponent((result, props, slots) => {
				const Astro = result.createAstro(props, slots);
				return Astro.rewrite(new URL('/', Astro.url));
			}),
			{ route: '/url-rewrite' },
		),
		createPage(indexPage, { route: '/', isIndex: true }),
		createPage(
			createComponent((result, props, slots) => {
				const Astro = result.createAstro(props, slots);
				return Astro.rewrite(new Request(new URL('/', Astro.url)));
			}),
			{ route: '/request-rewrite' },
		),
	]);

	it('rewrite with URL object renders index', async () => {
		const res = await app.render(new Request('http://example.com/url-rewrite'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});

	it('rewrite with Request object renders index', async () => {
		const res = await app.render(new Request('http://example.com/request-rewrite'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});
});

describe('Rewrites via App - base path with trailingSlash never', () => {
	const pageWithPath = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<h1>Page</h1><p>${Astro.url.pathname}</p>`;
	});

	const app = createTestApp(
		[
			createPage(rewriteTo('/page'), { route: '/rewrite-to-subpage' }),
			createPage(pageWithPath, { route: '/page' }),
		],
		{ base: '/base/', trailingSlash: 'never' },
	);

	it('rewrite to /page renders subpage with base in URL', async () => {
		const res = await app.render(new Request('http://example.com/base/rewrite-to-subpage'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page');
		assert.equal($('p').text(), '/base/page');
	});
});

describe('Rewrites via App - base path with trailingSlash always', () => {
	const indexWithPath = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<h1>Index</h1><p>${Astro.url.pathname}</p>`;
	});
	const pageWithPath = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<h1>Page</h1><p>${Astro.url.pathname}</p>`;
	});

	const app = createTestApp(
		[
			createPage(rewriteTo('/base/'), { route: '/rewrite-with-base-to-index-with-slash' }),
			createPage(indexWithPath, { route: '/', isIndex: true }),
			createPage(rewriteTo('/page/'), { route: '/rewrite-to-subpage-with-slash' }),
			createPage(rewriteTo('/base/page/'), { route: '/rewrite-with-base-to-subpage-with-slash' }),
			createPage(pageWithPath, { route: '/page' }),
		],
		{ base: '/base/', trailingSlash: 'always' },
	);

	it('rewrite to /base/ renders index', async () => {
		const res = await app.render(
			new Request('http://example.com/base/rewrite-with-base-to-index-with-slash/'),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '/base/');
	});

	it('rewrite to /page/ renders subpage', async () => {
		const res = await app.render(
			new Request('http://example.com/base/rewrite-to-subpage-with-slash/'),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page');
		assert.equal($('p').text(), '/base/page/');
	});

	it('rewrite to /base/page/ renders subpage', async () => {
		const res = await app.render(
			new Request('http://example.com/base/rewrite-with-base-to-subpage-with-slash/'),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Page');
		assert.equal($('p').text(), '/base/page/');
	});
});

describe('Rewrites via App - rewrite to dynamic route with slug', () => {
	const titlePage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const { slug } = Astro.params;
		return render`<h1>Title</h1><p>${slug}</p>`;
	});

	const app = createTestApp([
		createPage(rewriteTo('/some-slug/title'), { route: '/', isIndex: true }),
		createPage(titlePage, {
			route: '/[slug]/title',
			segments: [[dynamicPart('slug')], [staticPart('title')]],
			pathname: undefined,
		}),
	]);

	it('rewrite from index to [slug]/title renders with correct params', async () => {
		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.match($('h1').text(), /Title/);
		assert.match($('p').text(), /some-slug/);
	});
});

describe('Rewrites via App - runtime error with custom 500', () => {
	const app = createTestApp([
		createPage(rewriteTo('/errors/throw'), { route: '/errors/start' }),
		createPage(
			createComponent(() => {
				throw new Error('Intentional error');
			}),
			{ route: '/errors/throw' },
		),
		createPage(
			createComponent(() => render`<h1>I am the custom 500</h1>`),
			{ route: '/500', component: '500.astro' },
		),
	]);

	it('rewrite to a throwing page renders the custom 500', async () => {
		const res = await app.render(new Request('http://example.com/errors/start'));
		assert.equal(res.status, 500);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'I am the custom 500');
	});
});

describe('Rewrites via App - duplicate slashes', () => {
	const app = createTestApp([
		createPage(rewriteTo('//about'), { route: '/test' }),
		createPage(
			createComponent(() => render`<h1>about</h1>`),
			{ route: '/about' },
		),
	]);

	it('rewrite to //about resolves to /about', async () => {
		const res = await app.render(new Request('http://example.com/test'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'about');
	});
});

describe('Rewrites via App - dynamic routing with spaces', () => {
	const dynamicPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<h1>Index</h1><p>${Astro.params.id}</p>`;
	});

	const app = createTestApp([
		createPage(rewriteTo('/has space/test'), { route: '/foo' }),
		createPage(rewriteTo('/ABC abc 123'), { route: '/bar' }),
		createPage(dynamicPage, {
			route: '/has space/[id]',
			segments: [[staticPart('has space')], [dynamicPart('id')]],
			pathname: undefined,
		}),
		createPage(dynamicPage, {
			route: '/[id]',
			segments: [[dynamicPart('id')]],
			pathname: undefined,
		}),
	]);

	it('rewrites to a path with spaces in a static segment', async () => {
		const res = await app.render(new Request('http://example.com/foo'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});

	it('rewrites to a path with spaces in params', async () => {
		const res = await app.render(new Request('http://example.com/bar'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
	});
});

describe('Rewrites via App - runtime error without custom 500', () => {
	const app = createTestApp([
		createPage(rewriteTo('/errors/to'), { route: '/errors/from' }),
		createPage(
			createComponent(() => {
				throw new Error('Intentional error');
			}),
			{ route: '/errors/to' },
		),
	]);

	it('returns 500 with empty body when no custom 500 page', async () => {
		const res = await app.render(new Request('http://example.com/errors/from'));
		assert.equal(res.status, 500);
		const text = await res.text();
		assert.equal(text, '');
	});
});

describe('Rewrites via App - middleware rewrite with next()', () => {
	const middleware = async (_ctx, next) => {
		const response = await next('/');
		return response;
	};

	const app = createTestApp(
		[
			createPage(rewriteTo('/'), { route: '/foo' }),
			createPage(
				createComponent(() => render`<h1>Expected http status of index page is 200</h1>`),
				{ route: '/', isIndex: true },
			),
			createPage(rewriteTo('/'), { route: '/reroute' }),
		],
		{ middleware: () => ({ onRequest: middleware }) },
	);

	it('middleware next() rewrite returns 200', async () => {
		const res = await app.render(new Request('http://example.com/foo'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Expected http status of index page is 200');
	});

	it('page-level rewrite returns 200', async () => {
		const res = await app.render(new Request('http://example.com/reroute'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Expected http status of index page is 200');
	});
});

describe('Rewrites via App - i18n manual routing middleware rewrite', () => {
	const middleware = async (_ctx, next) => {
		const response = await next('/');
		return response;
	};

	const app = createTestApp(
		[
			createPage(
				createComponent(() => render`<h1>Expected http status of index page is 200</h1>`),
				{ route: '/', isIndex: true },
			),
		],
		{
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'es'],
				strategy: 'pathname-prefix-other-locales',
				fallbackType: 'rewrite',
				fallback: {},
				domains: {},
				domainLookupTable: {},
			},
			middleware: () => ({ onRequest: middleware }),
		},
	);

	it('returns 200 when middleware rewrites to homepage with i18n manual routing', async () => {
		const res = await app.render(new Request('http://example.com/reroute'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Expected http status of index page is 200');
	});
});

describe('Rewrites via App - issue 13633 middleware rewrite', () => {
	const middleware = async (_ctx, next) => {
		const response = await next('/');
		return response;
	};

	const app = createTestApp(
		[
			createPage(
				createComponent(() => render`<h1>Index page</h1>`),
				{ route: '/', isIndex: true },
			),
			createPage(
				createComponent(() => render`<h1>About</h1>`),
				{ route: '/about' },
			),
		],
		{ middleware: () => ({ onRequest: middleware }) },
	);

	it('should correctly rewrite to be homepage', async () => {
		const res = await app.render(new Request('http://example.com/foo'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index page');
	});
});

describe('Rewrites via App - middleware sequence with next() vs context.rewrite()', () => {
	const indexPageWithLocals = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const auth = Astro.locals.auth;
		return render`<h1>Index</h1>${auth ? render`<p>Called auth</p>` : ''}`;
	});

	const paramsPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const { id } = Astro.params;
		const auth = Astro.locals.auth;
		return render`<h1>Index with params</h1><p id="params">Param: ${id}</p><p id="locals">Locals: ${auth}</p>`;
	});

	let contextReroute = false;

	const first = async (_context, next) => next();

	const second = async (context, next) => {
		if (context.url.pathname.includes('/auth')) {
			if (context.url.pathname.includes('/auth/dashboard')) {
				contextReroute = true;
				return await context.rewrite('/');
			}
			if (context.url.pathname.includes('/auth/base')) {
				return await next('/');
			}
			if (context.url.pathname.includes('/auth/params')) {
				return next('/?foo=bar');
			}
			if (context.url.pathname.includes('/auth/astro-params')) {
				return next('/auth/1234');
			}
		}
		return next();
	};

	const third = async (context, next) => {
		if (context.url.pathname.startsWith('/') && contextReroute === false) {
			context.locals.auth = 'Third function called';
		}
		if (context.params?.id === '1234') {
			context.locals.auth = 'Params changed';
		}
		return next();
	};

	const app = createTestApp(
		[
			createPage(indexPageWithLocals, { route: '/', isIndex: true }),
			createPage(
				createComponent(() => render``),
				{ route: '/auth/base' },
			),
			createPage(
				createComponent(() => render``),
				{ route: '/auth/dashboard' },
			),
			createPage(
				createComponent(() => render``),
				{ route: '/auth/params' },
			),
			createPage(
				createComponent(() => render``),
				{ route: '/auth/astro-params' },
			),
			createPage(paramsPage, {
				route: '/auth/[id]',
				segments: [[staticPart('auth')], [dynamicPart('id')]],
				pathname: undefined,
			}),
		],
		{ middleware: () => ({ onRequest: sequence(first, second, third) }) },
	);

	it('next("/") preserves locals from subsequent middleware', async () => {
		contextReroute = false;
		const res = await app.render(new Request('http://example.com/auth/base'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), 'Called auth');
	});

	it('context.rewrite("/") skips subsequent middleware — no locals', async () => {
		contextReroute = false;
		const res = await app.render(new Request('http://example.com/auth/dashboard'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Index');
		assert.equal($('p').text(), '');
	});

	it('next("/?foo=bar") rewrites with query params', async () => {
		contextReroute = false;
		const res = await app.render(new Request('http://example.com/auth/params'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.match($('h1').text(), /Index/);
	});

	it('next("/auth/1234") rewrites to dynamic route with new params', async () => {
		contextReroute = false;
		const res = await app.render(new Request('http://example.com/auth/astro-params'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.match($('h1').text(), /Index with params/);
		assert.match($('#params').text(), /Param: 1234/);
		assert.match($('#locals').text(), /Locals: Params changed/);
	});
});

describe('Rewrites via App - middleware with custom 404 and 500', () => {
	const errorPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const interjected = Astro.locals.interjected;
		return render`<h1>Custom error</h1><p>${interjected}</p>`;
	});

	const middleware = async (context, next) => {
		if (context.url.pathname.startsWith('/404') || context.url.pathname.startsWith('/500')) {
			context.locals.interjected = 'Interjected';
		}
		return await next();
	};

	const app = createTestApp(
		[
			createPage(rewriteTo('/404'), { route: '/about' }),
			createPage(rewriteTo('/500'), { route: '/about-2' }),
			createPage(errorPage, { route: '/404', component: '404.astro' }),
			createPage(errorPage, { route: '/500', component: '500.astro' }),
		],
		{ middleware: () => ({ onRequest: middleware }) },
	);

	it('rewrite to /404 renders custom 404 with middleware locals', async () => {
		const res = await app.render(new Request('http://example.com/about'));
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Custom error');
		assert.equal($('p').text(), 'Interjected');
	});

	it('rewrite to /500 renders custom 500 with middleware locals', async () => {
		const res = await app.render(new Request('http://example.com/about-2'));
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Custom error');
		assert.equal($('p').text(), 'Interjected');
	});
});

describe('Rewrites via App - body-used rewrite returns 500', () => {
	const bodyUsedPage = createComponent(async (result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		if (Astro.request.method === 'POST') {
			await Astro.request.text();
		}
		return Astro.rewrite('/post/post-b');
	});

	const app = createTestApp([
		createPage(bodyUsedPage, { route: '/post/post-body-used' }),
		createPage(postBPage, { route: '/post/post-b' }),
	]);

	it('returns 500 when rewriting after body has been consumed', async () => {
		const formData = new FormData();
		formData.append('email', 'example@example.com');
		const res = await app.render(
			new Request('http://example.com/post/post-body-used', {
				method: 'POST',
				body: formData,
			}),
		);
		assert.equal(res.status, 500);
	});
});

describe('Rewrites via App - routePattern updated after sequence rewrite', () => {
	const patternPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		return render`<p>${Astro.locals.pattern}</p>`;
	});

	const first = async (context, next) => {
		if (context.url.pathname === '/index2') {
			return next('/123/post');
		}
		return next('/destination');
	};

	const second = async (context, next) => {
		context.locals.pattern = context.routePattern;
		return next();
	};

	const app = createTestApp(
		[
			createPage(
				createComponent(() => render``),
				{ route: '/', isIndex: true },
			),
			createPage(
				createComponent(() => render``),
				{ route: '/index2' },
			),
			createPage(patternPage, { route: '/destination' }),
			createPage(patternPage, {
				route: '/[id]/post',
				segments: [[dynamicPart('id')], [staticPart('post')]],
				pathname: undefined,
			}),
		],
		{ middleware: () => ({ onRequest: sequence(first, second) }) },
	);

	it('routePattern is /destination after rewrite from /', async () => {
		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('p').text(), '/destination');
	});

	it('routePattern is /[id]/post after rewrite from /index2', async () => {
		const res = await app.render(new Request('http://example.com/index2'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('p').text(), '/[id]/post');
	});
});
