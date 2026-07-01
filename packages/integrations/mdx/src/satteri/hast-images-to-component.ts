import {
	defineHastPlugin,
	type HastNode,
	type HastPluginDefinition,
	type MdxJsxAttributeNode,
} from 'satteri';
import { ASTRO_IMAGE_ELEMENT } from '../image-constants.js';
import { makeJsxAttr, makeJsxExprAttr } from './jsx-utils.js';

export interface ImageImportInfo {
	importedImages: Map<string, string>;
	hasImages: boolean;
}

export function createImageToComponentPlugin(
	imageImportInfo: ImageImportInfo,
): HastPluginDefinition {
	return defineHastPlugin({
		name: 'image-to-component',
		element: {
			filter: ['img'],
			visit(node, ctx) {
				const src = node.properties?.src;
				if (typeof src !== 'string') return;

				const decodedSrc = decodeURI(src);
				const astro = ctx.data.astro;
				const isLocal = astro?.localImagePaths.has(decodedSrc) ?? false;
				const isRemote = astro?.remoteImagePaths.has(decodedSrc) ?? false;
				if (!isLocal && !isRemote) return;

				const attrs: MdxJsxAttributeNode[] = [];

				if (node.properties) {
					for (const [key, value] of Object.entries(node.properties)) {
						if (key === 'src') continue;
						if (value == null || value === false) continue;

						if (key === 'widths' || key === 'densities') {
							attrs.push(makeJsxExprAttr(key, JSON.stringify(String(value).split(' '))));
						} else {
							const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
							attrs.push(makeJsxAttr(attrName, String(value)));
						}
					}
				}

				if (isLocal) {
					let importName = imageImportInfo.importedImages.get(decodedSrc);
					if (!importName) {
						importName = `__${imageImportInfo.importedImages.size}_${decodedSrc.replace(/\W/g, '_')}__`;
						imageImportInfo.importedImages.set(decodedSrc, importName);
					}
					attrs.push(makeJsxExprAttr('src', importName));
				} else {
					const hasWidth = node.properties && 'width' in node.properties;
					const hasHeight = node.properties && 'height' in node.properties;
					if (!hasWidth || !hasHeight) {
						attrs.push(makeJsxExprAttr('inferSize', 'true'));
					}
					attrs.push(makeJsxAttr('src', decodedSrc));
				}

				imageImportInfo.hasImages = true;

				// Emit `<astro-image>` (lowercase hyphenated) so MDX routes the tag through
				// `_components['astro-image']`. The vite-plugin-mdx-postprocess wraps the
				// final component to map `astro-image` → `components.img ?? __AstroImage__`,
				// which lets a user's `export const components = { img: MyImage }` win.
				// Match the unified pipeline, which emits a flow (block) element for
				// markdown-derived images so MDX compiles them consistently.
				return {
					type: 'mdxJsxFlowElement',
					name: ASTRO_IMAGE_ELEMENT,
					attributes: attrs,
					children: [],
				} as unknown as HastNode;
			},
		},
	});
}
