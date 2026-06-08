import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { appSymbol } from '../../../dist/core/constants.js';
import { astro, getFetchState } from '../../../dist/core/hono/index.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createPage, createTestApp } from '../mocks.ts';

const page = createComponent((result: any, props: any, slots: any) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1>${Astro.locals.message ?? 'Hello from Hono'}</h1>`;
});

type HonoEnv = {
	Variables: {
		fetchState: FetchState;
	};
};

function createHonoApp(astroApp: ReturnType<typeof createTestApp>) {
	const hono = new Hono<HonoEnv>();
	hono.use(async (context, next) => {
		Reflect.set(context.req.raw, appSymbol, astroApp);
		await next();
	});
	return hono;
}

describe('astro() Hono middleware', () => {
	it('renders an Astro page when used as the request handler', async () => {
		const hono = createHonoApp(createTestApp([createPage(page, { route: '/' })]));
		hono.use(astro());

		const response = await hono.fetch(new Request('http://example.com/'));

		assert.equal(response.status, 200);
		assert.match(await response.text(), /<h1>Hello from Hono<\/h1>/);
	});

	it('reuses a pre-existing FetchState from earlier Hono middleware', async () => {
		const astroApp = createTestApp([createPage(page, { route: '/' })]);
		const hono = createHonoApp(astroApp);
		hono.use(async (context, next) => {
			const state = new FetchState(astroApp.pipeline, context.req.raw);
			state.locals = { message: 'from stashed FetchState' } as any;
			context.set('fetchState', state);
			await next();
		});
		hono.use(astro());

		const response = await hono.fetch(new Request('http://example.com/'));

		assert.equal(response.status, 200);
		assert.match(await response.text(), /<h1>from stashed FetchState<\/h1>/);
	});
});

describe('getFetchState()', () => {
	it('creates a new FetchState from the Hono context', async () => {
		const astroApp = createTestApp([createPage(page, { route: '/' })]);
		const hono = createHonoApp(astroApp);
		let capturedState: FetchState | undefined;
		hono.use(async (context, next) => {
			capturedState = getFetchState(context);
			await next();
		});
		hono.use(astro());

		const response = await hono.fetch(new Request('http://example.com/'));

		assert.equal(response.status, 200);
		assert.ok(capturedState instanceof FetchState, 'getFetchState should return a FetchState');
	});

	it('returns the same FetchState on subsequent calls', async () => {
		const astroApp = createTestApp([createPage(page, { route: '/' })]);
		const hono = createHonoApp(astroApp);
		let firstState: FetchState | undefined;
		let secondState: FetchState | undefined;
		hono.use(async (context, next) => {
			firstState = getFetchState(context);
			secondState = getFetchState(context);
			await next();
		});
		hono.use(astro());

		await hono.fetch(new Request('http://example.com/'));

		assert.ok(firstState);
		assert.equal(firstState, secondState, 'getFetchState should return the same instance');
	});

	it('allows custom middleware to set locals via getFetchState', async () => {
		const astroApp = createTestApp([createPage(page, { route: '/' })]);
		const hono = createHonoApp(astroApp);
		hono.use(async (context, next) => {
			const state = getFetchState(context);
			state.locals = { message: 'set via getFetchState' } as any;
			await next();
		});
		hono.use(astro());

		const response = await hono.fetch(new Request('http://example.com/'));

		assert.equal(response.status, 200);
		assert.match(await response.text(), /<h1>set via getFetchState<\/h1>/);
	});
});
