import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
	createFixture,
	createRequestAndResponse,
	fetchFromContainer,
	startContainerFromFixture,
} from '../test-utils.js';

const middleware = `
import { defineMiddleware, sequence } from 'astro:middleware';

const first = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/admin') {
		if (!context.request.headers.get('Authorization')) {
			return context.redirect('/');
		}
		return next();
	}
	if (url.pathname === '/lorem') {
		context.locals.name = 'ipsum';
		return next();
	}
	if (url.pathname === '/rewrite') {
		return new Response('<span>New content!!</span>', { status: 200, headers: { 'Content-Type': 'text/html' } });
	}
	if (url.pathname === '/broken-500') {
		return new Response(null, { status: 500 });
	}
	if (url.pathname === '/clone') {
		const response = await next();
		const newResponse = response.clone();
		const html = await newResponse.text();
		return new Response(html.replace('testing', 'it works'), {
			status: 200,
			headers: response.headers,
		});
	}
	if (url.pathname === '/return-response-cookies') {
		const response = await next();
		const text = await response.text();
		return new Response(text, {
			status: response.status,
			headers: response.headers,
		});
	}
	if (url.pathname === '/') {
		context.cookies.set('foo', 'bar');
	}
	context.locals.name = 'bar';
	return next();
});

const second = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/second') {
		context.locals.name = 'second';
	}
	return next();
});

const third = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/does-nothing') {
		return undefined;
	}
	return next();
});

const fourth = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/no-route-but-200') {
		return new Response("It's OK!", { status: 200 });
	}
	return next();
});

export const onRequest = sequence(first, second, third, fourth);
`;

const integrationPre = `
export default function() {
	return {
		name: 'pre-middleware',
		hooks: {
			'astro:config:setup': ({ addMiddleware }) => {
				addMiddleware({
					entrypoint: new URL('./integration-middleware-pre.js', import.meta.url).pathname,
					order: 'pre',
				});
			},
		},
	};
}
`;

const integrationPreMiddleware = `
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware((context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/integration-pre') {
		return new Response(JSON.stringify({ pre: 'works' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return next();
});
`;

const integrationPost = `
export default function() {
	return {
		name: 'post-middleware',
		hooks: {
			'astro:config:setup': ({ addMiddleware }) => {
				addMiddleware({
					entrypoint: new URL('./integration-middleware-post.js', import.meta.url).pathname,
					order: 'post',
				});
			},
		},
	};
}
`;

const integrationPostMiddleware = `
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware((context, next) => {
	const url = new URL(context.request.url);
	if (url.pathname === '/integration-post') {
		return new Response(JSON.stringify({ post: 'works' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return next();
});
`;

const fixtureTree = {
	'/src/middleware.js': middleware,
	'/integration-pre.js': integrationPre,
	'/integration-middleware-pre.js': integrationPreMiddleware,
	'/integration-post.js': integrationPost,
	'/integration-middleware-post.js': integrationPostMiddleware,
	'/src/pages/index.astro': `---
const data = Astro.locals;
---
<html><head></head><body><span>Index</span><p>{data?.name}</p></body></html>`,
	'/src/pages/lorem.astro': `---
const data = Astro.locals;
---
<html><head></head><body><p>{data?.name}</p></body></html>`,
	'/src/pages/second.astro': `---
const data = Astro.locals;
---
<html><head></head><body><p>{data?.name}</p></body></html>`,
	'/src/pages/rewrite.astro': `<p>Rewrite</p>`,
	'/src/pages/broken-500.astro': `\n`,
	'/src/pages/not-interested.astro': `<html><head></head><body><p>Not interested</p></body></html>`,
	'/src/pages/does-nothing.astro': `<html><head></head><body><p>Not interested</p></body></html>`,
	'/src/pages/clone.astro': `---\n---\n<html><head></head><body><h1>testing</h1></body></html>`,
	'/src/pages/return-response-cookies.astro': `---
Astro.cookies.set("astro", "cookie", { httpOnly: true, path: "/", sameSite: "strict", maxAge: 1704085200 });
---`,
	'/src/pages/admin.astro': `<html><head></head><body><h1>Admin Panel</h1><p>Secret admin content</p></body></html>`,
	'/src/pages/no-route-but-200.astro': `<p>Should not render</p>`,
	'/src/pages/path with spaces.astro': `<html><head></head><body><p>This page has spaces in its path</p></body></html>`,
	'/src/pages/integration-pre.astro': `---
const data = Astro.locals;
---
<html><head></head><body><p>{data?.name}</p></body></html>`,
	'/src/pages/integration-post.astro': `---
const data = Astro.locals;
---
<html><head></head><body><p>{data?.name}</p></body></html>`,
};

describe('Middleware in DEV mode (unit)', () => {
	/** @type {import('fs-fixture').Fixture} */
	let fixture;
	/** @type {import('../../../src/core/dev/container.js').Container} */
	let container;

	before(async () => {
		fixture = await createFixture(fixtureTree);
		container = await startContainerFromFixture({ inlineConfig: { root: fixture.path } });
	});

	after(async () => {
		await container.close();
		await fixture.rm();
	});

	it('should render locals data', async () => {
		const { $ } = await fetchFromContainer(container, '/');
		assert.equal($('p').html(), 'bar');
	});

	it('should change locals data based on URL', async () => {
		{
			const { $ } = await fetchFromContainer(container, '/');
			assert.equal($('p').html(), 'bar');
		}
		{
			const { $ } = await fetchFromContainer(container, '/lorem');
			assert.equal($('p').html(), 'ipsum');
		}
	});

	it('should call a second middleware', async () => {
		const { $ } = await fetchFromContainer(container, '/second');
		assert.equal($('p').html(), 'second');
	});

	it('should successfully create a new response', async () => {
		const { $ } = await fetchFromContainer(container, '/rewrite');
		assert.equal($('p').html(), null);
		assert.equal($('span').html(), 'New content!!');
	});

	it('should return a new response that is a 500', async () => {
		const { status } = await fetchFromContainer(container, '/broken-500');
		assert.equal(status, 500);
	});

	it('should successfully render a page if the middleware calls only next() and returns nothing', async () => {
		const { $ } = await fetchFromContainer(container, '/not-interested');
		assert.equal($('p').html(), 'Not interested');
	});

	it("should throw an error when the middleware doesn't call next or doesn't return a response", async () => {
		const { $ } = await fetchFromContainer(container, '/does-nothing');
		assert.equal($('title').html(), 'MiddlewareNoDataOrNextCalled');
	});

	it('should return 200 if the middleware returns a 200 Response', async () => {
		const { status, text } = await fetchFromContainer(container, '/no-route-but-200');
		assert.equal(status, 200);
		assert.match(text, /It's OK!/);
	});

	it('should allow setting cookies', async () => {
		const { req, res, done } = createRequestAndResponse({ method: 'GET', url: '/' });
		container.handle(req, res);
		await done;
		const cookies = res.getHeader('set-cookie');
		assert.ok(Array.isArray(cookies) ? cookies.includes('foo=bar') : cookies === 'foo=bar');
	});

	it('should be able to clone the response', async () => {
		const { text } = await fetchFromContainer(container, '/clone');
		assert.equal(text.includes('it works'), true);
	});

	it('should forward cookies set in a component when the middleware returns a new response', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/return-response-cookies',
		});
		container.handle(req, res);
		await done;
		const setCookie = res.getHeader('set-cookie');
		assert.notEqual(setCookie, null);
		assert.notEqual(setCookie, undefined);
	});

	it('should allow legitimate single-encoded paths like /path%20with%20spaces', async () => {
		const { status } = await fetchFromContainer(container, '/path%20with%20spaces');
		assert.equal(status, 200);
	});
});
