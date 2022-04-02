import type { AstroConfig, RouteType } from '../../@types/astro';
import npath from 'path';
import { appendForwardSlash } from '../../core/path.js';

const STATUS_CODE_PAGES = new Set(['/404', '/500']);

function getOutRoot(astroConfig: AstroConfig): URL {
	return new URL('./', astroConfig.outDir);
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
			switch (astroConfig.build.format) {
				case 'directory': {
					if (STATUS_CODE_PAGES.has(pathname)) {
						return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
					}
					return new URL('.' + appendForwardSlash(pathname), outRoot);
				}
				case 'file': {
					return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
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
