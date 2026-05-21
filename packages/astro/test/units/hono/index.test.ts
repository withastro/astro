import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { FetchState } from '../../../dist/core/fetch/fetch-state.js';
import { appSymbol } from '../../../dist/core/constants.js';
import { astro } from '../../../dist/core/hono/index.js';
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
