import type { SSRElement } from '../../@types/astro';

import npath from 'path-browserify';
import { appendForwardSlash } from '../../core/path.js';

function getRootPath(site?: string): string {
	return appendForwardSlash(new URL(site || 'http://localhost/').pathname);
}

function joinToRoot(href: string, site?: string): string {
	return npath.posix.join(getRootPath(site), href);
}

export function createLinkStylesheetElement(href: string, site?: string): SSRElement {
	return {
		props: {
			rel: 'stylesheet',
			href: joinToRoot(href, site),
		},
		children: '',
	};
}

export function createLinkStylesheetElementSet(hrefs: string[], site?: string) {
	return new Set<SSRElement>(hrefs.map((href) => createLinkStylesheetElement(href, site)));
}

export function createModuleScriptElementWithSrc(src: string, site?: string): SSRElement {
	return {
		props: {
			type: 'module',
			src: joinToRoot(src, site),
		},
		children: '',
	};
}

export function createModuleScriptElementWithSrcSet(srces: string[], site?: string): Set<SSRElement> {
	return new Set<SSRElement>(srces.map((src) => createModuleScriptElementWithSrc(src, site)));
}
