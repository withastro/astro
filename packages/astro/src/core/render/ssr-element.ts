import { getAssetsPrefix } from '../../assets/utils/getAssetsPrefix.js';
import { fileExtension, joinPaths, prependForwardSlash, slash } from '../../core/path.js';
import type { SSRElement } from '../../types/public/internal.js';
import type { AssetsPrefix, StylesheetAsset } from '../app/types.js';

export function createAssetLink(
	href: string,
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): string {
	let url = '';
	if (assetsPrefix) {
		const pf = getAssetsPrefix(fileExtension(href), assetsPrefix);
		url = joinPaths(pf, slash(href));
	} else if (base) {
		url = prependForwardSlash(joinPaths(base, slash(href)));
	} else {
		url = href;
	}
	if (queryParams) {
		url += '?' + queryParams.toString();
	}
	return url;
}

function createStylesheetElement(
	stylesheet: StylesheetAsset,
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): SSRElement {
	if (stylesheet.type === 'inline') {
		return {
			props: {},
			children: stylesheet.content,
		};
	} else {
		return {
			props: {
				rel: 'stylesheet',
				href: createAssetLink(stylesheet.src, base, assetsPrefix, queryParams),
			},
			children: '',
		};
	}
}

export function createStylesheetElementSet(
	stylesheets: StylesheetAsset[],
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): Set<SSRElement> {
	return new Set(
		stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix, queryParams)),
	);
}

export function createModuleScriptElement(
	script: { type: 'inline' | 'external'; value: string },
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): SSRElement {
	if (script.type === 'external') {
		return createModuleScriptElementWithSrc(script.value, base, assetsPrefix, queryParams);
	} else {
		return {
			props: {
				type: 'module',
			},
			children: script.value,
		};
	}
}

function createModuleScriptElementWithSrc(
	src: string,
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): SSRElement {
	return {
		props: {
			type: 'module',
			src: createAssetLink(src, base, assetsPrefix, queryParams),
		},
		children: '',
	};
}
