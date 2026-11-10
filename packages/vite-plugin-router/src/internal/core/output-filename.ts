import type { BuildFormat } from '../../index.js';
import type { RouteData } from '../../index.js';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { STATUS_CODE_PAGES } from './constants.js';

export function getOutputFilename(buildFormat: BuildFormat, name: string, routeData: RouteData) {
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
