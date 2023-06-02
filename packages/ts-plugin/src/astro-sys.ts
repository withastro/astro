import type ts from 'typescript/lib/tsserverlibrary';
import type { Logger } from './logger.js';
import { ensureRealAstroFilePath, isVirtualAstroFilePath, toRealAstroFilePath } from './utils.js';

/**
 * This should only be accessed by TS astro module resolution.
 */
export function createAstroSys(
	logger: Logger,
	typescript: typeof import('typescript/lib/tsserverlibrary')
) {
	const astroSys: ts.System = {
		...typescript.sys,
		fileExists(path: string) {
			return typescript.sys.fileExists(ensureRealAstroFilePath(path));
		},
		readDirectory(path, extensions, exclude, include, depth) {
			const extensionsWithAstro = (extensions ?? []).concat('.astro');

			return typescript.sys.readDirectory(path, extensionsWithAstro, exclude, include, depth);
		},
	};

	if (typescript.sys.realpath) {
		const realpath = typescript.sys.realpath;
		astroSys.realpath = function (path) {
			if (isVirtualAstroFilePath(path)) {
				return realpath(toRealAstroFilePath(path)) + '.ts';
			}
			return realpath(path);
		};
	}

	return astroSys;
}
