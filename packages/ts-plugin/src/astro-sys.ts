import ts from 'typescript';
import type { Logger } from './logger.js';
import { ensureRealAstroFilePath, isVirtualAstroFilePath, toRealAstroFilePath } from './utils.js';

/**
 * This should only be accessed by TS astro module resolution.
 */
export function createAstroSys(logger: Logger) {
	const astroSys: ts.System = {
		...ts.sys,
		fileExists(path: string) {
			return ts.sys.fileExists(ensureRealAstroFilePath(path));
		},
		readDirectory(path, extensions, exclude, include, depth) {
			const extensionsWithAstro = (extensions ?? []).concat('.astro');

			return ts.sys.readDirectory(path, extensionsWithAstro, exclude, include, depth);
		},
	};

	if (ts.sys.realpath) {
		const realpath = ts.sys.realpath;
		astroSys.realpath = function (path) {
			if (isVirtualAstroFilePath(path)) {
				return realpath(toRealAstroFilePath(path)) + '.ts';
			}
			return realpath(path);
		};
	}

	return astroSys;
}
