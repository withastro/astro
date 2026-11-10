import type { FetchPipelineHandler } from '@astrojs/vite-plugin-router';
import { finalizeI18n, getI18n } from './handler.js';

/**
 * The `i18n` pipeline step: post-processes the response of the rest of the pipeline against the
 * manifest's i18n configuration (locale redirects, 404s for invalid locales, fallback routing).
 */
const i18nHandler: FetchPipelineHandler = async (state, next) => {
	const response = await next(state);
	const i18n = getI18n(state.manifest);
	return i18n ? finalizeI18n(i18n, state, response) : response;
};
export default i18nHandler;
