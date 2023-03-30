import slashify from 'slash';
import type { SSRElement } from '../../@types/astro';
import { joinPaths, prependForwardSlash } from '../../core/path.js';

export function createAssetLink(href: string, base?: string, assetsPrefix?: string): string {
	if (assetsPrefix) {
		return joinPaths(assetsPrefix, slashify(href));
	} else if (base) {
		return prependForwardSlash(joinPaths(base, slashify(href)));
	} else {
		return href;
	}
}

export function createLinkStylesheetElement(
	href: string,
	base?: string,
	assetsPrefix?: string
): SSRElement {
	return {
		props: {
			rel: 'stylesheet',
			href: createAssetLink(href, base, assetsPrefix),
		},
		children: '',
	};
}

export function createLinkStylesheetElementSet(
	hrefs: string[],
	base?: string,
	assetsPrefix?: string
) {
	return new Set<SSRElement>(
		hrefs.map((href) => createLinkStylesheetElement(href, base, assetsPrefix))
	);
}

export function createModuleScriptElement(
	script: { type: 'inline' | 'external'; value: string },
	base?: string,
	assetsPrefix?: string
): SSRElement {
	if (script.type === 'external') {
		return createModuleScriptElementWithSrc(script.value, base, assetsPrefix);
	} else {
		return {
			props: {
				type: 'module',
			},
			children: script.value,
		};
	}
}

export function createModuleScriptElementWithSrc(
	src: string,
	base?: string,
	assetsPrefix?: string
): SSRElement {
	return {
		props: {
			type: 'module',
			src: createAssetLink(src, base, assetsPrefix),
		},
		children: '',
	};
}

export function createModuleScriptElementWithSrcSet(
	srces: string[],
	site?: string,
	assetsPrefix?: string
): Set<SSRElement> {
	return new Set<SSRElement>(
		srces.map((src) => createModuleScriptElementWithSrc(src, site, assetsPrefix))
	);
}

export function createModuleScriptsSet(
	scripts: { type: 'inline' | 'external'; value: string }[],
	base?: string,
	assetsPrefix?: string
): Set<SSRElement> {
	return new Set<SSRElement>(
		scripts.map((script) => createModuleScriptElement(script, base, assetsPrefix))
	);
}
