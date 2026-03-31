import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { context, pages, actions, i18n, redirects, rewrite } from 'astro/hono';

const app = new Hono();

// 1. Request logging — see every request in the terminal
app.use(logger());

// 2. Astro context — sets up locals and clientAddress
app.use(context());

// 3. Auth gate — runs before any Astro rendering
app.use(async (c, next) => {
	const url = new URL(c.req.url);
	if (url.pathname.startsWith('/dashboard')) {
		const session = c.req.header('cookie')?.includes('session=');
		if (!session) {
			return c.redirect('/login');
		}
	}
	await next();
});

// 4. Astro features, composed individually so you can see (and control) the order
app.use(redirects());
app.use(actions());
app.use(rewrite());
app.use(i18n());
app.use(pages());

export default app;
