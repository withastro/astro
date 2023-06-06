import npath from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { AstroConfig, RouteType } from '../../@types/astro';
import { appendForwardSlash } from '../../core/path.js';

const STATUS_CODE_PAGES = new Set(['/404', '/500']);
const FALLBACK_OUT_DIR_NAME = './.astro/';

function getOutRoot(astroConfig: AstroConfig): URL {
	if (astroConfig.output === 'static') {
		return new URL('./', astroConfig.outDir);
	} else {
		return new URL('./', astroConfig.build.client);
	}
}

export function getOutFolder(
	astroConfig: AstroConfig,
	pathname: string,
	routeType: RouteType
): URL {
	const outRoot = getOutRoot(astroConfig);

	// This is the root folder to write to.
	switch (routeType) {
		case 'endpoint':
			return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
		case 'page':
		case 'redirect':
			switch (astroConfig.build.format) {
				case 'directory': {
					if (STATUS_CODE_PAGES.has(pathname)) {
						return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
					}
					return new URL('.' + appendForwardSlash(pathname), outRoot);
				}
				case 'file': {
					const d = pathname === '' ? pathname : npath.dirname(pathname);
					return new URL('.' + appendForwardSlash(d), outRoot);
				}
			}
	}
}

export function getOutFile(
	astroConfig: AstroConfig,
	outFolder: URL,
	pathname: string,
	routeType: RouteType
): URL {
	switch (routeType) {
		case 'endpoint':
			return new URL(npath.basename(pathname), outFolder);
		case 'page':
		case 'redirect':
			switch (astroConfig.build.format) {
				case 'directory': {
					if (STATUS_CODE_PAGES.has(pathname)) {
						const baseName = npath.basename(pathname);
						return new URL('./' + (baseName || 'index') + '.html', outFolder);
					}
					return new URL('./index.html', outFolder);
				}
				case 'file': {
					const baseName = npath.basename(pathname);
					return new URL('./' + (baseName || 'index') + '.html', outFolder);
				}
			}
	}
}

/**
 * Ensures the `outDir` is within `process.cwd()`. If not it will fallback to `<cwd>/.astro`.
 * This is used for static `ssrBuild` so the output can access node_modules when we import
 * the output files. A hardcoded fallback dir is fine as it would be cleaned up after build.
 */
export function getOutDirWithinCwd(outDir: URL): URL {
	if (fileURLToPath(outDir).startsWith(process.cwd())) {
		return outDir;
	} else {
		return new URL(FALLBACK_OUT_DIR_NAME, pathToFileURL(process.cwd() + npath.sep));
	}
}
