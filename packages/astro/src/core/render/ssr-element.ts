import type { SSRElement } from '../../@types/astro';

import npath from 'path-browserify';
import { appendForwardSlash } from '../../core/path.js';

function getRootPath(base?: string): string {
	return appendForwardSlash(new URL(base || '/', 'http://localhost/').pathname);
}

function joinToRoot(href: string, base?: string): string {
	return npath.posix.join(getRootPath(base), href);
}

export function createLinkStylesheetElement(href: string, base?: string): SSRElement {
	return {
		props: {
			rel: 'stylesheet',
			href: joinToRoot(href, base),
		},
		children: '',
	};
}

export function createLinkStylesheetElementSet(hrefs: string[], base?: string) {
	return new Set<SSRElement>(hrefs.map((href) => createLinkStylesheetElement(href, base)));
}

export function createModuleScriptElement(
	script: { type: 'inline' | 'external'; value: string },
	base?: string
): SSRElement {
	if (script.type === 'external') {
		return createModuleScriptElementWithSrc(script.value, base);
	} else {
		return {
			props: {
				type: 'module',
			},
			children: script.value,
		};
	}
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

export function createModuleScriptElementWithSrcSet(
	srces: string[],
	site?: string
): Set<SSRElement> {
	return new Set<SSRElement>(srces.map((src) => createModuleScriptElementWithSrc(src, site)));
}

export function createModuleScriptsSet(
	scripts: { type: 'inline' | 'external'; value: string }[],
	base?: string
): Set<SSRElement> {
	return new Set<SSRElement>(scripts.map((script) => createModuleScriptElement(script, base)));
}
