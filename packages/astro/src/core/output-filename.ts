import type { AstroConfig } from '../types/public/config.js';
import type { RouteData } from '../types/public/internal.js';
import { removeTrailingForwardSlash } from './path.js';

const STATUS_CODE_PAGES = new Set(['/404', '/500']);

export function getOutputFilename(
	buildFormat: NonNullable<AstroConfig['build']>['format'],
	name: string,
	routeData: RouteData,
) {
	if (routeData.type === 'endpoint') {
		return name;
	}
	if (name === '/' || name === '') {
		return name === '' ? 'index.html' : '/index.html';
	}
	if (buildFormat === 'file' || STATUS_CODE_PAGES.has(name)) {
		return `${removeTrailingForwardSlash(name || 'index')}.html`;
	}
	if (buildFormat === 'preserve' && !routeData.isIndex) {
		return `${removeTrailingForwardSlash(name || 'index')}.html`;
	}
	return `${removeTrailingForwardSlash(name)}/index.html`;
}
