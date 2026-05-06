import { shared } from './shared';

export const onRequest = async (ctx, next) => {
	if (ctx.url.pathname === '/private' && !ctx.cookies.get('auth')?.value) {
		return ctx.redirect('/login');
	}

	ctx.locals.name = shared;
	ctx.locals.buildPhase = ctx.buildPhase;
	const response = await next();
	if (ctx.url.pathname === '/private') {
		response.headers.set('x-prerender-private', 'true');
	}
	response.headers.set('x-build-phase', ctx.buildPhase);
	return response;
};
