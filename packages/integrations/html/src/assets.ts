import { pathToFileURL } from 'node:url'
import type { Plugin } from 'unified';
import type { Root, RootContent, Element } from 'hast';
import { visit } from 'unist-util-visit';
import MagicString from 'magic-string';

import { replaceAttribute } from './utils.js';

const rehypeAssets: Plugin<[{ s: MagicString, imports: Map<string, string> }], Root> = ({ s, imports }) => {
  return (tree, file) => {
		const fileURL = new URL(file.path, 'file://');
		function addImport(el: Element, attr: string, value: string) {
			let url = value.trim();

			// Skip if url points to id, e.g. sprite sheets
			if (url.startsWith('#')) return

			if (/^https?:\/\//.test(url)) return

			if (el.tagName === 'script') {
				url = `${url}`;
			}

			if (url.startsWith('.')) {
				url = '/@fs/' + new URL(url, fileURL).pathname.slice(1);
			}
			url += `?url`
			let importName = ''

			if (imports.has(url)) {
				importName = imports.get(url)!
			} else {
				importName = `${ASSET_PREFIX}${imports.size}`;
				imports.set(url, importName)
			}

			replaceAttribute(s, el, attr, `${attr}="\${${importName}}"`);
	}


    visit(tree, (node: Root | RootContent) => {
      if (node.type !== 'element') return;
			check(node);
			function check(el: Element) {
				const name = el.tagName;
				for (const source of DEFAULT_SOURCES) {
					if (source.tag !== name) continue;

					const attributes = el.properties ?? {};

					if (source.filter && !source.filter({ attributes })) {
						continue;
					}

					// Check src
					source.srcAttributes?.forEach((attr) => {
						const value = attributes[attr];
						if (!value) return;
						addImport(el, attr, value.toString());
					});

					// Check srcset
					source.srcsetAttributes?.forEach((attr) => {
						const value = attributes[attr];
						if (!value) return;
						const srcsetRegex = /\s*([^,\s]+).*?(?:,|$)\s*/gm;
						let match: RegExpExecArray | null;
						while ((match = srcsetRegex.exec(value.toString()))) {
							addImport(el, attr, match[1]);
						}
					});
				}
			}
    });
  }
}

export default rehypeAssets;

export interface AssetSource {
	tag: string;
	srcAttributes?: string[];
	srcsetAttributes?: string[];
	filter?: (metadata: FilterMetadata) => boolean;
}

export interface FilterMetadata {
	attributes: Record<string, any>;
}

export const ASSET_PREFIX = '___ASSET___';

const ALLOWED_REL = [
	'stylesheet',
	'icon',
	'shortcut icon',
	'mask-icon',
	'apple-touch-icon',
	'apple-touch-icon-precomposed',
	'apple-touch-startup-image',
	'manifest',
	'prefetch',
	'preload',
];

const ALLOWED_ITEMPROP = [
	'image',
	'logo',
	'screenshot',
	'thumbnailurl',
	'contenturl',
	'downloadurl',
	'duringmedia',
	'embedurl',
	'installurl',
	'layoutimage',
];

const ALLOWED_META_NAME = [
	'msapplication-tileimage',
	'msapplication-square70x70logo',
	'msapplication-square150x150logo',
	'msapplication-wide310x150logo',
	'msapplication-square310x310logo',
	'msapplication-config',
	'twitter:image',
];

const ALLOWED_META_PROPERTY = [
	'og:image',
	'og:image:url',
	'og:image:secure_url',
	'og:audio',
	'og:audio:secure_url',
	'og:video',
	'og:video:secure_url',
	'vk:image',
];

const DEFAULT_SOURCES: AssetSource[] = [
	{
		tag: 'script',
		srcAttributes: ['src'],
	},
	{
		tag: 'audio',
		srcAttributes: ['src'],
	},
	{
		tag: 'embed',
		srcAttributes: ['src'],
	},
	{
		tag: 'img',
		srcAttributes: ['src'],
		srcsetAttributes: ['srcset'],
	},
	{
		tag: 'input',
		srcAttributes: ['src'],
	},
	{
		tag: 'object',
		srcAttributes: ['src'],
	},
	{
		tag: 'source',
		srcAttributes: ['src'],
		srcsetAttributes: ['srcset'],
	},
	{
		tag: 'track',
		srcAttributes: ['src'],
	},
	{
		tag: 'video',
		srcAttributes: ['poster', 'src'],
	},
	{
		tag: 'image',
		srcAttributes: ['href', 'xlink:href'],
	},
	{
		tag: 'use',
		srcAttributes: ['href', 'xlink:href'],
	},
	{
		tag: 'link',
		srcAttributes: ['href'],
		srcsetAttributes: ['imagesrcset'],
		filter({ attributes }) {
			if (attributes.rel && ALLOWED_REL.includes(attributes.rel.trim().toLowerCase())) {
				return true;
			}

			if (
				attributes.itemprop &&
				ALLOWED_ITEMPROP.includes(attributes.itemprop.trim().toLowerCase())
			) {
				return true;
			}

			return false;
		},
	},
	{
		tag: 'meta',
		srcAttributes: ['content'],
		filter({ attributes }) {
			if (attributes.name && ALLOWED_META_NAME.includes(attributes.name.trim().toLowerCase())) {
				return true;
			}

			if (
				attributes.property &&
				ALLOWED_META_PROPERTY.includes(attributes.property.trim().toLowerCase())
			) {
				return true;
			}

			if (
				attributes.itemprop &&
				ALLOWED_ITEMPROP.includes(attributes.itemprop.trim().toLowerCase())
			) {
				return true;
			}

			return false;
		},
	},
];
