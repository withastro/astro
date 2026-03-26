import { astro } from 'astro/hono';
import { Hono } from 'hono';

const app = new Hono();

app.use(async (_c, next) => {
	// Put custom Hono middleware here (auth, logging, A/B flags, or per-request locals).
	await next();
});

app.use(astro());

export default app;
