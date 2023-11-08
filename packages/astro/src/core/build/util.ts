import type { AstroConfig } from '../../@types/astro.js';

export function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}

/**
 * Given the Astro configuration, it tells if a slash should be appended or not
 */
export function shouldAppendForwardSlash(
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format']
): boolean {
	switch (trailingSlash) {
		case 'always':
			return true;
		case 'never':
			return false;
		case 'ignore': {
			switch (buildFormat) {
				case 'directory':
					return true;
				case 'file':
					return false;
			}
		}
	}
}

export function i18nHasFallback(config: AstroConfig): boolean {
	if (config.experimental.i18n && config.experimental.i18n.fallback) {
		// we have some fallback and the control is not none
		return Object.keys(config.experimental.i18n.fallback).length > 0;
	}

	return false;
}
