import { getAttribute, hasAttribute, getTagName } from '@web/parse5-utils';
import parse5 from 'parse5';
import { isStylesheetLink } from './extract-assets.js';

const tagsWithSrcSet = new Set(['img', 'source']);

function startsWithSrcRoot(pathname: string, srcRoot: string, srcRootWeb: string): boolean {
	return (
		pathname.startsWith(srcRoot) || // /Users/user/project/src/styles/main.css
		pathname.startsWith(srcRootWeb) || // /src/styles/main.css
		`/${pathname}`.startsWith(srcRoot)
	); // Windows fix: some paths are missing leading "/"
}

export function isInSrcDirectory(
	node: parse5.Element,
	attr: string,
	srcRoot: string,
	srcRootWeb: string
): boolean {
	const value = getAttribute(node, attr);
	return value ? startsWithSrcRoot(value, srcRoot, srcRootWeb) : false;
}

export function isAstroInjectedLink(node: parse5.Element): boolean {
	return isStylesheetLink(node) && getAttribute(node, 'data-astro-injected') === '';
}

export function isBuildableLink(
	node: parse5.Element,
	srcRoot: string,
	srcRootWeb: string
): boolean {
	if (isAstroInjectedLink(node)) {
		return true;
	}

	const href = getAttribute(node, 'href');
	if (typeof href !== 'string' || !href.length) {
		return false;
	}

	return startsWithSrcRoot(href, srcRoot, srcRootWeb);
}

export function isBuildableImage(
	node: parse5.Element,
	srcRoot: string,
	srcRootWeb: string
): boolean {
	if (getTagName(node) === 'img') {
		const src = getAttribute(node, 'src');
		return src ? startsWithSrcRoot(src, srcRoot, srcRootWeb) : false;
	}
	return false;
}

export function hasSrcSet(node: parse5.Element): boolean {
	return tagsWithSrcSet.has(getTagName(node)) && !!getAttribute(node, 'srcset');
}

export function isHoistedScript(node: parse5.Element): boolean {
	return getTagName(node) === 'script' && hasAttribute(node, 'hoist');
}
