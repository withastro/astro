import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { actions, middleware, pages, i18n } from 'astro/hono';

const app = new Hono();

// Request logging — see every request in the terminal.
app.use(logger());

// Auth gate — redirects unauthenticated dashboard requests before Astro renders.
app.use(async (c, next) => {
	const url = new URL(c.req.url);
	if (url.pathname.startsWith('/dashboard')) {
		const session = getCookie(c, 'session');
		if (!session) {
			return c.redirect('/login');
		}
	}
	return next();
});

// Astro Actions (RPC + form).
app.use(actions());

// User middleware from src/middleware.ts (calls next Hono handler internally).
app.use(middleware());

// Page rendering (endpoints, pages, fallbacks).
app.use(pages());

// i18n post-processing (locale redirects, fallback routing).
app.use(i18n());

export default app;
