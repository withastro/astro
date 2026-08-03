// Mock authentication example
// See https://docs.astro.build/en/guides/authentication/ for available authentication strategies and best practices.

import type { APIContext } from 'astro';

const sessionCookieName = 'user-session';
const validSessionValue = 'valid-session';

export const auth = {
	api: {
		getSession: async (context: APIContext) => {
			const sessionCookie = context.cookies.get(sessionCookieName);
			if (sessionCookie?.value === validSessionValue) {
				return { user: { id: 1, name: 'John Doe' } };
			}
			return null;
		},
		logout: async (context: APIContext) => {
			context.cookies.delete(sessionCookieName, { path: '/' });
			return new Response('Logged out', { status: 200 });
		},

		login: async (context: APIContext) => {
			// get from query params
			const data = await context.request.formData();
			const username = data.get('username');
			const password = data.get('password');
			// dummy validation - only check that username and password are provided
			if (username && password) {
				context.cookies.set(sessionCookieName, validSessionValue, {
					httpOnly: true,
					path: '/',
					maxAge: 60 * 60 * 24, // 1 day
				});
				return context.redirect('/api/finish-login', 302);
			}
			return new Response('Invalid credentials', { status: 401 });
		},
	},
};
