import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { astro } from 'astro/hono';

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

app.use(astro());

export default app;
