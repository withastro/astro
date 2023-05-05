import { defineMiddleware, sequence } from 'astro/middleware';
import htmlMinifier from 'html-minifier';

const limit = 50;

const loginInfo = {
	token: undefined,
	currentTime: undefined,
};

export const minifier = defineMiddleware(async (context, next) => {
	const response = await next();
	// check if the response is returning some HTML
	if (response.headers.get('content-type') === 'text/html') {
		let headers = response.headers;
		let html = await response.text();
		let newHtml = htmlMinifier.minify(html, {
			removeAttributeQuotes: true,
			collapseWhitespace: true,
		});
		return new Response(newHtml, {
			status: 200,
			headers,
		});
	}
	return response;
});

const validation = defineMiddleware(async (context, next) => {
	if (context.request.url.endsWith('/admin')) {
		if (loginInfo.currentTime) {
			const difference = new Date().getTime() - loginInfo.currentTime;
			if (difference > limit) {
				console.log('hit threshold');
				loginInfo.token = undefined;
				loginInfo.currentTime = undefined;
				return context.redirect('/login');
			}
		}
		// we naively check if we have a token
		if (loginInfo.token && loginInfo.token === 'loggedIn') {
			// we fill the locals with user-facing information
			context.locals.user = {
				name: 'AstroUser',
				surname: 'AstroSurname',
			};
			return await next();
		} else {
			loginInfo.token = undefined;
			loginInfo.currentTime = undefined;
			return context.redirect('/login');
		}
	} else if (context.request.url.endsWith('/api/login')) {
		const response = await next();
		// the login endpoint will return to us a JSON with username and password
		const data = await response.json();
		// we naively check if username and password are equals to some string
		if (data.username === 'astro' && data.password === 'astro') {
			// we store the token somewhere outside of locals because the `locals` object is attached to the request
			// and when doing a redirect, we lose that information
			loginInfo.token = 'loggedIn';
			loginInfo.currentTime = new Date().getTime();
			return context.redirect('/admin');
		}
	}
	return next();
});

export const onRequest = sequence(validation, minifier);
