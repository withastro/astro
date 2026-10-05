/**
 * De-localizes locale-prefixed URLs to clean paths, mirroring how i18n
 * middleware (e.g. Paraglide) keeps public URLs like "/en/about" while the
 * app's routes live at clean paths like "/about".
 *
 * @type {import("astro").MiddlewareResponseHandler}
 */
export const onRequest = async (context, next) => {
	const [, first, ...rest] = context.url.pathname.split('/');
	if (first === 'en' || first === 'fr') {
		const url = new URL(context.url);
		url.pathname = rest.length ? `/${rest.join('/')}` : '/';
		return next(url);
	}
	return next();
};
