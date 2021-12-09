import { Document, Element, Node } from 'parse5';
import npath from 'path';
import { findElements, getTagName, getAttribute, findNodes, hasAttribute } from '@web/parse5-utils';
import adapter from 'parse5/lib/tree-adapters/default.js';

const hashedLinkRels = ['stylesheet', 'preload'];
const linkRels = [...hashedLinkRels, 'icon', 'manifest', 'apple-touch-icon', 'mask-icon'];
const windowsPathRE = /^[A-Z]:\//;

function getSrcSetUrls(srcset: string) {
  if (!srcset) {
    return [];
  }
  const srcsetParts = srcset.includes(',') ? srcset.split(',') : [srcset];
  const urls = srcsetParts.map((url) => url.trim()).map((url) => (url.includes(' ') ? url.split(' ')[0] : url));
  return urls;
}

function extractFirstUrlOfSrcSet(node: Element) {
  const srcset = getAttribute(node, 'srcset');
  if (!srcset) {
    return '';
  }
  const urls = getSrcSetUrls(srcset);
  return urls[0];
}

function isAsset(node: Element) {
  let path = '';
  switch (getTagName(node)) {
    case 'img':
      path = getAttribute(node, 'src') ?? '';
      break;
    case 'source':
      path = extractFirstUrlOfSrcSet(node) ?? '';
      break;
    case 'link':
      if (linkRels.includes(getAttribute(node, 'rel') ?? '')) {
        path = getAttribute(node, 'href') ?? '';
      }
      break;
    case 'meta':
      if (getAttribute(node, 'property') === 'og:image' && getAttribute(node, 'content')) {
        path = getAttribute(node, 'content') ?? '';
      }
      break;
    case 'script':
      if (getAttribute(node, 'type') !== 'module' && getAttribute(node, 'src')) {
        path = getAttribute(node, 'src') ?? '';
      }
      break;
    default:
      return false;
  }
  if (!path) {
    return false;
  }
  // Windows fix: if path starts with C:/, avoid URL parsing
  if (windowsPathRE.test(path)) {
    return true;
  }
  try {
    new URL(path);
    return false;
  } catch (e) {
    return true;
  }
}

function isInlineScript(node: Element): boolean {
  switch (getTagName(node)) {
    case 'script':
      if (getAttribute(node, 'type') === 'module' && !getAttribute(node, 'src')) {
        return true;
      }
      return false;
    default:
      return false;
  }
}

function isExternalScript(node: Element): boolean {
  switch (getTagName(node)) {
    case 'script':
      if (hasAttribute(node, 'src')) {
        return true;
      }
      return false;
    default:
      return false;
  }
}

function isInlineStyle(node: Element): boolean {
  return getTagName(node) === 'style';
}

export function isStylesheetLink(node: Element): boolean {
  return getTagName(node) === 'link' && getAttribute(node, 'rel') === 'stylesheet';
}

export function isHashedAsset(node: Element) {
  switch (getTagName(node)) {
    case 'img':
      return true;
    case 'source':
      return true;
    case 'script':
      return true;
    case 'link':
      return hashedLinkRels.includes(getAttribute(node, 'rel')!);
    case 'meta':
      return true;
    default:
      return false;
  }
}

export function resolveAssetFilePath(browserPath: string, htmlDir: string, projectRootDir: string, absolutePathPrefix?: string) {
  const _browserPath = absolutePathPrefix && browserPath[0] === '/' ? '/' + npath.posix.relative(absolutePathPrefix, browserPath) : browserPath;
  return npath.join(_browserPath.startsWith('/') ? projectRootDir : htmlDir, _browserPath.split('/').join(npath.sep));
}

export function getSourceAttribute(node: Element) {
  switch (getTagName(node)) {
    case 'img': {
      return 'src';
    }
    case 'source': {
      return 'srcset';
    }
    case 'link': {
      return 'href';
    }
    case 'script': {
      return 'src';
    }
    case 'meta': {
      return 'content';
    }
    default:
      throw new Error(`Unknown node with tagname ${getTagName(node)}`);
  }
}

export interface Location {
  start: number;
  end: number;
}

export function getSourcePaths(node: Element) {
  const key = getSourceAttribute(node);

  let location: Location = { start: 0, end: 0 };
  const src = getAttribute(node, key);
  if (node.sourceCodeLocation) {
    let loc = node.sourceCodeLocation.attrs?.[key];
    if (loc) {
      location.start = loc.startOffset;
      location.end = loc.endOffset;
    }
  }
  if (typeof key !== 'string' || src === '') {
    throw new Error(`Missing attribute ${key} in element ${node.nodeName}`);
  }

  let paths: { path: string; location: Location }[] = [];
  if (src && key === 'srcset') {
    paths = getSrcSetUrls(src).map((path) => ({
      path,
      location,
    }));
  } else if (src) {
    paths.push({
      path: src,
      location,
    });
  }

  return paths;
}

export function getTextContent(node: Node): string {
  if (adapter.isCommentNode(node)) {
    return node.data || '';
  }
  if (adapter.isTextNode(node)) {
    return node.value || '';
  }
  const subtree = findNodes(node, (n) => adapter.isTextNode(n));
  return subtree.map(getTextContent).join('');
}

export function getAttributes(node: Element): Record<string, any> {
  return Object.fromEntries(node.attrs.map((attr) => [attr.name, attr.value]));
}

export function findAssets(document: Document) {
  return findElements(document, isAsset);
}

export function findInlineScripts(document: Document) {
  return findElements(document, isInlineScript);
}

export function findExternalScripts(document: Document) {
  return findElements(document, isExternalScript);
}

export function findInlineStyles(document: Document) {
  return findElements(document, isInlineStyle);
}

export function findStyleLinks(document: Document) {
  return findElements(document, isStylesheetLink);
}
