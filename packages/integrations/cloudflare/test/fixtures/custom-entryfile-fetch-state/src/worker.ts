import { astro, FetchState } from 'astro/fetch';
import { pages } from 'astro/hono';
import { cf as cfFetch, finalize } from '@astrojs/cloudflare/fetch';
import { cf as cfHono } from '@astrojs/cloudflare/hono';
import { Hono } from 'hono';

const hono = new Hono<{ Bindings: Env; Variables: { fetchState: FetchState } }>();
hono.use('/hono', cfHono());
hono.use('/hono-immutable', cfHono());
hono.get('/hono-immutable', (context) => {
	context.get('fetchState').cookies.set('hono-immutable', '1', { path: '/' });
	return Response.redirect('https://example.com/');
});
hono.get('/hono', pages());

// The documented "advanced" custom worker: build the request state from the
// bare workerd request, let cf() serve static assets, and hand everything
// else to Astro.
hono.all('*', async (context) => {
	const state = new FetchState(context.req.raw);
	const asset = await cfFetch(state, context.env, context.executionCtx);
	if (asset) return asset;
	const response = await astro(state);
	response.headers.set('X-Fetch-State-Entrypoint', 'true');
	return finalize(state, response);
});

export default hono;
