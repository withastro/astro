import { getAssetsPrefix } from '../../assets/utils/getAssetsPrefix.js';
import { fileExtension, joinPaths, prependForwardSlash, slash } from '../../core/path.js';
const URL_PARSE_BASE = 'https://astro.build';
function splitAssetPath(path) {
	const parsed = new URL(path, URL_PARSE_BASE);
	const isAbsolute = URL.canParse(path);
	const pathname =
		!isAbsolute && !path.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
	return {
		pathname,
		suffix: `${parsed.search}${parsed.hash}`,
	};
}
function appendQueryParams(path, queryParams) {
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
function createAssetLink(href, base, assetsPrefix, queryParams) {
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
function createStylesheetElement(stylesheet, base, assetsPrefix, queryParams) {
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
function createStylesheetElementSet(stylesheets, base, assetsPrefix, queryParams) {
	return new Set(
		stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix, queryParams)),
	);
}
function createModuleScriptElement(script, base, assetsPrefix, queryParams) {
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
function createModuleScriptElementWithSrc(src, base, assetsPrefix, queryParams) {
	return {
		props: {
			type: 'module',
			src: createAssetLink(src, base, assetsPrefix, queryParams),
		},
		children: '',
	};
}
export { createAssetLink, createModuleScriptElement, createStylesheetElementSet };
