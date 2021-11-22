
import { getAttribute, hasAttribute, getTagName, insertBefore, remove, createScript, createElement, setAttribute } from '@web/parse5-utils';
import parse5 from 'parse5';
import { findAssets, findExternalScripts, findInlineScripts, findInlineStyles, getTextContent, isStylesheetLink } from './extract-assets.js';

const tagsWithSrcSet = new Set(['img', 'source']);

export function isInSrcDirectory(node: parse5.Element, attr: string, srcRoot: string, srcRootWeb: string): boolean {
  const value = getAttribute(node, attr);
  return value ? value.startsWith(srcRoot) || value.startsWith(srcRootWeb) : false;
};

export function isAstroInjectedLink(node: parse5.Element): boolean {
  return isStylesheetLink(node) && getAttribute(node, 'data-astro-injected') === '';
}

export function isBuildableLink(node: parse5.Element, srcRoot: string, srcRootWeb: string): boolean {
  if (isAstroInjectedLink(node)) {
    return true;
  }

  const href = getAttribute(node, 'href');
  if (typeof href !== 'string' || !href.length) {
    return false;
  }

  return href.startsWith(srcRoot) // /Users/user/project/src/styles/main.css
    || href.startsWith(srcRootWeb) // /src/styles/main.css
    || `/${href}`.startsWith(srcRoot); // Windows fix: some paths are missing leading "/"
};

export function isBuildableImage(node: parse5.Element, srcRoot: string, srcRootWeb: string): boolean {
  if(getTagName(node) === 'img') {
    const src = getAttribute(node, 'src');
    return !!(src?.startsWith(srcRoot) || src?.startsWith(srcRootWeb));
  }
  return false;
}

export function hasSrcSet(node: parse5.Element): boolean {
  return tagsWithSrcSet.has(getTagName(node)) && !!getAttribute(node, 'srcset');
}

export function isHoistedScript(node: parse5.Element): boolean {
  return getTagName(node) === 'script' && hasAttribute(node, 'hoist');
}