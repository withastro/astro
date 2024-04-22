import type { AstroConfig } from 'astro';
import { type ExportSpecifier, type ImportSpecifier, parse } from 'es-module-lexer';
import type { Plugin } from 'vite';
import {
	ASTRO_IMAGE_ELEMENT,
	ASTRO_IMAGE_IMPORT,
	USES_ASTRO_IMAGE_FLAG,
} from './remark-images-to-component.js';
import { type FileInfo, getFileInfo } from './utils.js';

// These transforms must happen *after* JSX runtime transformations
export function vitePluginMdxPostprocess(astroConfig: AstroConfig): Plugin {
	return {
		name: '@astrojs/mdx-postprocess',
		transform(code, id) {
			if (!id.endsWith('.mdx')) return;

			const fileInfo = getFileInfo(id, astroConfig);
			const [imports, exports] = parse(code);

			// Call a series of functions that transform the code
			code = injectFragmentImport(code, imports);
			code = injectMetadataExports(code, exports, fileInfo);
			code = transformContentExport(code, exports);
			code = annotateContentExport(code, id);

			// The code transformations above are append-only, so the line/column mappings are the same
			// and we can omit the sourcemap for performance.
			return { code, map: null };
		},
	};
}

const fragmentImportRegex = /[\s,{](?:Fragment,|Fragment\s*\})/;

/**
 * Inject `Fragment` identifier import if not already present. It should already be injected,
 * but check just to be safe.
 *
 * TODO: Double-check if we no longer need this function.
 */
function injectFragmentImport(code: string, imports: readonly ImportSpecifier[]) {
	const importsFromJSXRuntime = imports
		.filter(({ n }) => n === 'astro/jsx-runtime')
		.map(({ ss, se }) => code.substring(ss, se));
	const hasFragmentImport = importsFromJSXRuntime.some((statement) =>
		fragmentImportRegex.test(statement)
	);
	if (!hasFragmentImport) {
		code = `import { Fragment } from "astro/jsx-runtime"\n` + code;
	}
	return code;
}

/**
 * Inject MDX metadata as exports of the module.
 */
function injectMetadataExports(
	code: string,
	exports: readonly ExportSpecifier[],
	fileInfo: FileInfo
) {
	if (!exports.some(({ n }) => n === 'url')) {
		code += `\nexport const url = ${JSON.stringify(fileInfo.fileUrl)};`;
	}
	if (!exports.some(({ n }) => n === 'file')) {
		code += `\nexport const file = ${JSON.stringify(fileInfo.fileId)};`;
	}
	return code;
}

/**
 * Transforms the `MDXContent` default export as `Content`, which wraps `MDXContent` and
 * passes additional `components` props.
 */
function transformContentExport(code: string, exports: readonly ExportSpecifier[]) {
	if (exports.find(({ n }) => n === 'Content')) return code;

	// If have `export const components`, pass that as props to `Content` as fallback
	const hasComponents = exports.find(({ n }) => n === 'components');
	const usesAstroImage = exports.find(({ n }) => n === USES_ASTRO_IMAGE_FLAG);

	// Generate code for the `components` prop passed to `MDXContent`
	let componentsCode = `{ Fragment${hasComponents ? ', ...components' : ''}, ...props.components,`;
	if (usesAstroImage) {
		componentsCode += ` ${JSON.stringify(ASTRO_IMAGE_ELEMENT)}: ${
			hasComponents ? 'components.img ?? ' : ''
		} props.components?.img ?? ${ASTRO_IMAGE_IMPORT}`;
	}
	componentsCode += ' }';

	// Make `Content` the default export so we can wrap `MDXContent` and pass in `Fragment`
	code = code.replace('export default function MDXContent', 'function MDXContent');
	code += `
export const Content = (props = {}) => MDXContent({
  ...props,
  components: ${componentsCode},
});
export default Content;`;
	return code;
}

/**
 * Add properties to the `Content` export.
 */
function annotateContentExport(code: string, id: string) {
	// Mark `Content` as MDX component
	code += `\nContent[Symbol.for('mdx-component')] = true`;
	// Ensure styles and scripts are injected into a `<head>` when a layout is not applied
	code += `\nContent[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;
	// Assign the `moduleId` metadata to `Content`
	code += `\nContent.moduleId = ${JSON.stringify(id)};`;

	return code;
}
