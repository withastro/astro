import type { AstroConfig } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

/**
 * The base URL
 */
export function getI18nBaseUrl(locale: string, config: AstroConfig, logger: Logger) {
	if (!config.experimental.i18n) {
		logger.debug('i18n', "The project isn't using i18n features, no need to use this function.");
		return;
	}
	const base = config.base;

	if (base) {
		logger.debug('i18n', 'The project has a base directory, using it.');
		return `${base}/${locale}/`;
	} else {
		return `/${locale}/`;
	}
}
