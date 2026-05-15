import { getFetchStateFromAPIContext } from '../core/fetch/fetch-state.js';
import { I18n } from '../core/i18n/handler.js';
function createI18nMiddleware(i18n, base, trailingSlash, format) {
	if (!i18n) return (_, next) => next();
	const handler = new I18n(i18n, base, trailingSlash, format);
	return async (context, next) => {
		const response = await next();
		return handler.finalize(getFetchStateFromAPIContext(context), response);
	};
}
export { createI18nMiddleware };
