import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { context, pages, actions, i18n, redirects, rewrite } from 'astro/hono';

const app = new Hono();

// Request logging — see every request in the terminal
app.use(logger());

// Auth gate — uses context() to access Astro's locals, cookies, etc.
app.use(async (c, next) => {
	const { url, cookies } = await context(c);
	if (url.pathname.startsWith('/dashboard')) {
		const session = cookies.get('session');
		if (!session) {
			return c.redirect('/login');
		}
	}
	return next();
});

app.use(redirects({ '/old-dashboard': '/dashboard' }));
app.use(actions());
app.use(rewrite());
app.use(i18n());
app.use(pages());

export default app;
