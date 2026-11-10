import npath from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	joinPaths,
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { BuildFormat, RouterConfig, RouteType, TrailingSlash } from '../../../index.js';
import type { RouteData } from '../../../index.js';
import { STATUS_CODE_PAGES } from '../constants.js';
import type { BuildAdapter } from './types.js';

const FALLBACK_OUT_DIR_NAME = './.astro/';

/** The build options that decide where the build writes its files. */
export interface OutputLayout {
	config: Pick<RouterConfig, 'outDir'> & {
		build: Pick<RouterConfig['build'], 'client' | 'server' | 'format'>;
	};
	buildOutput: 'static' | 'server';
	host: { adapter: BuildAdapter | undefined };
}

/** The directory the server build writes to. */
export function getServerOutputDirectory({ config, buildOutput, host }: OutputLayout): URL {
	const preserveStructure = host.adapter?.adapterFeatures?.preserveBuildServerDir;
	if (buildOutput === 'server' || preserveStructure) {
		return config.build.server;
	}
	return getOutDirWithinCwd(config.outDir);
}

/** The directory the prerender environment writes to. */
export function getPrerenderOutputDirectory(layout: OutputLayout): URL {
	return new URL('./.prerender/', getServerOutputDirectory(layout));
}

/** The directory the client build and the prerendered pages are written to. */
export function getClientOutputDirectory({ config, buildOutput, host }: OutputLayout): URL {
	const preserveStructure = host.adapter?.adapterFeatures?.preserveBuildClientDir;
	if (buildOutput === 'server' || preserveStructure) {
		return config.build.client;
	}
	return config.outDir;
}

export function pathToDirectoryURL(path: string): URL {
	return new URL(appendForwardSlash(pathToFileURL(path).href));
}

export function getOutFolder({
	outRoot,
	buildFormat,
	pathname,
	routeData,
}: {
	outRoot: URL;
	buildFormat: BuildFormat;
	pathname: string;
	routeData: RouteData;
}): URL {
	const routeType = routeData.type;

	// This is the root folder to write to.
	switch (routeType) {
		case 'endpoint':
			return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
		case 'fallback':
		case 'page':
		case 'redirect':
			switch (buildFormat) {
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
				case 'preserve': {
					let dir;
					// If the pathname is '' then this is the root index.html
					// If this is an index route, the folder should be the pathname, not the parent
					if (pathname === '' || routeData.isIndex) {
						dir = pathname;
					} else {
						dir = npath.dirname(pathname);
					}
					return new URL('.' + appendForwardSlash(dir), outRoot);
				}
			}
	}
}

export function getOutFile(
	buildFormat: BuildFormat,
	outFolder: URL,
	pathname: string,
	routeData: RouteData,
): URL {
	const routeType = routeData.type;
	switch (routeType) {
		case 'endpoint':
			return new URL(npath.basename(pathname), outFolder);
		case 'page':
		case 'fallback':
		case 'redirect':
			switch (buildFormat) {
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
				case 'preserve': {
					let baseName = npath.basename(pathname);
					// If there is no base name this is the root route.
					// If this is an index route, the name should be `index.html`.
					if (!baseName || routeData.isIndex) {
						baseName = 'index';
					}
					return new URL(`./${baseName}.html`, outFolder);
				}
			}
	}
}

/**
 * Ensures the `outDir` is within `process.cwd()`. If not it will fall back to `<cwd>/.astro`.
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

export function getUrlForPath(
	pathname: string,
	base: string,
	origin: string,
	format: BuildFormat,
	trailingSlash: TrailingSlash,
	routeType: RouteType,
	isIndex: boolean,
): URL {
	/**
	 * Examples:
	 * pathname: /, /foo
	 * base: /
	 */

	// `pathname` is decoded, but the request pathname is decoded again before
	// route matching, so it must be encoded for characters like `%` and `\`
	// to survive the round trip.
	pathname = encodeURI(pathname);

	let ending: string;
	// For `preserve`, non-index routes output as flat `.html` files (like `file`),
	// while index routes output as `dir/index.html` (like `directory`).
	const effectiveFormat = format === 'preserve' ? (isIndex ? 'directory' : 'file') : format;
	switch (effectiveFormat) {
		case 'directory': {
			ending = trailingSlash === 'never' ? '' : '/';
			break;
		}
		case 'file':
		default: {
			ending = '.html';
			break;
		}
	}
	let buildPathname: string;
	if (pathname === '/' || pathname === '') {
		if (effectiveFormat === 'file') {
			buildPathname = joinPaths(base, 'index.html');
		} else {
			buildPathname = collapseDuplicateTrailingSlashes(base + ending, trailingSlash !== 'never');
		}
	} else if (routeType === 'endpoint') {
		const buildPathRelative = removeLeadingForwardSlash(pathname);
		let endpointPathname = joinPaths(base, buildPathRelative);
		if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
			endpointPathname = appendForwardSlash(endpointPathname);
		} else if (trailingSlash === 'never') {
			endpointPathname = removeTrailingForwardSlash(endpointPathname);
		}
		buildPathname = endpointPathname;
	} else {
		const buildPathRelative =
			removeTrailingForwardSlash(removeLeadingForwardSlash(pathname)) + ending;
		buildPathname = joinPaths(base, buildPathRelative);
	}
	return new URL(buildPathname, origin);
}
