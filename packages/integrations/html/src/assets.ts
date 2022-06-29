import { pathToFileURL } from 'node:url'

export interface AssetSource {
	tag: string;
	srcAttributes?: string[];
	srcsetAttributes?: string[];
	filter?: (metadata: FilterMetadata) => boolean;
}

export interface FilterMetadata {
	attributes: Record<string, string>;
}

export const ASSET_PREFIX = '___ASSET___';

export function transformAssets(document: Document, id: string) {
	// Import path to import name
	// e.g. ./foo.png => ___ASSET___0
	const imports = new Map<string, string>();

	function addImport(el: Element, attr: string, value: string) {
		let url = value.trim();

		// Skip if url points to id, e.g. sprite sheets
		if (url.startsWith('#')) return

		if (/^https?:\/\//.test(url)) return

		if (el.localName === 'script' || (el.localName === 'link' && el.getAttribute('rel') === 'stylesheet')) {
			url = `${url}?url`;
		}

		url = '/@fs/' + new URL('../' + url, `file://${pathToFileURL(id).pathname}/`).toString().slice('file://'.length);
		let importName = ''

		if (imports.has(url)) {
			importName = imports.get(url)!
		} else {
			importName = `${ASSET_PREFIX}${imports.size}`;
			imports.set(url, importName)
		}
		
		const newValue = el.getAttribute(attr)!.replace(value, `\${${importName}}`);
		el.setAttribute(attr, newValue);
	}

	const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, null);

	function check(node: Node) {
		const el = node as Element;
		const name = node.nodeName.toLowerCase();
		for (const source of DEFAULT_SOURCES) {
			if (source.tag !== name) continue;

			function getAttributes() {
				const attributes: Record<string, string> = {}
				for (const attr of el.attributes) {
					attributes[attr.name] = attr.value;
				}
				return attributes;
			}

			if (source.filter && !source.filter({ attributes: getAttributes() })) {
				continue;
			}

			// Check src
			source.srcAttributes?.forEach((attr) => {
				const value = el.getAttribute(attr);
				if (!value) return;
				addImport(el, attr, value);
			});

			// Check srcset
			source.srcsetAttributes?.forEach((attr) => {
				const value = el.getAttribute(attr);
				if (!value) return;
				const srcsetRegex = /\s*([^,\s]+).*?(?:,|$)\s*/gm;
				let match: RegExpExecArray | null;
				while ((match = srcsetRegex.exec(value))) {
					addImport(el, attr, match[1]);
				}
			});
		}
	}

	let currentNode: Node | null = walker.root;
	while (currentNode) {
		check(currentNode);
		currentNode = walker.nextNode();
	}

	if (imports.size > 0) {
		let importText = ''
		for (const [path, importName] of imports.entries()) {
			importText += `import ${importName} from "${path}";\n`
		}
		return importText;
	}

	return '';
}

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
