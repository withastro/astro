import { getAssetsPrefix } from '../../assets/utils/getAssetsPrefix.js';
import { fileExtension, joinPaths, prependForwardSlash, slash } from '../../core/path.js';
import type { SSRElement } from '../../types/public/internal.js';
import type { AssetsPrefix, StylesheetAsset } from '../app/types.js';

const URL_PARSE_BASE = 'https://astro.build';

function splitAssetPath(path: string): { pathname: string; suffix: string } {
	const parsed = new URL(path, URL_PARSE_BASE);
	const isAbsolute = URL.canParse(path);
	const pathname =
		!isAbsolute && !path.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;

	return {
		pathname,
		suffix: `${parsed.search}${parsed.hash}`,
	};
}

function appendQueryParams(path: string, queryParams: URLSearchParams): string {
	const queryString = queryParams.toString();
	if (!queryString) {
		return path;
	}

	const hashIndex = path.indexOf('#');
	const basePath = hashIndex === -1 ? path : path.slice(0, hashIndex);
	const hash = hashIndex === -1 ? '' : path.slice(hashIndex);
	const separator = basePath.includes('?') ? '&' : '?';

	return `${basePath}${separator}${queryString}${hash}`;
}

export function createAssetLink(
	href: string,
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): string {
	const { pathname, suffix } = splitAssetPath(href);
	let url = '';
	if (assetsPrefix) {
		const pf = getAssetsPrefix(fileExtension(pathname), assetsPrefix);
		url = joinPaths(pf, slash(pathname)) + suffix;
	} else if (base) {
		url = prependForwardSlash(joinPaths(base, slash(pathname))) + suffix;
	} else {
		url = href;
	}
	if (queryParams) {
		url = appendQueryParams(url, queryParams);
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
