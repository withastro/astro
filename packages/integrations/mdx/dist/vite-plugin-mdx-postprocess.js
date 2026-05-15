import { parse } from 'es-module-lexer';
import {
	ASTRO_IMAGE_ELEMENT,
	ASTRO_IMAGE_IMPORT,
	USES_ASTRO_IMAGE_FLAG,
} from './rehype-images-to-component.js';
import { getFileInfo } from './utils.js';
const underscoreFragmentImportRegex = /[\s,{]_Fragment[\s,}]/;
const astroTagComponentImportRegex = /[\s,{]__astro_tag_component__[\s,}]/;
function vitePluginMdxPostprocess(astroConfig) {
	return {
		name: '@astrojs/mdx-postprocess',
		transform: {
			filter: {
				id: /\.mdx$/,
			},
			handler(code, id) {
				const fileInfo = getFileInfo(id, astroConfig);
				const [imports, exports] = parse(code);
				code = injectUnderscoreFragmentImport(code, imports);
				code = injectMetadataExports(code, exports, fileInfo);
				code = transformContentExport(code, exports);
				code = annotateContentExport(
					code,
					id,
					this.environment.name === 'ssr' || this.environment.name === 'prerender',
					imports,
				);
				return { code, map: null };
			},
		},
	};
}
function injectUnderscoreFragmentImport(code, imports) {
	if (!isSpecifierImported(code, imports, underscoreFragmentImportRegex, 'astro/jsx-runtime')) {
		code += `
import { Fragment as _Fragment } from 'astro/jsx-runtime';`;
	}
	return code;
}
function injectMetadataExports(code, exports, fileInfo) {
	if (!exports.some(({ n }) => n === 'url')) {
		code += `
export const url = ${JSON.stringify(fileInfo.fileUrl)};`;
	}
	if (!exports.some(({ n }) => n === 'file')) {
		code += `
export const file = ${JSON.stringify(fileInfo.fileId)};`;
	}
	return code;
}
function transformContentExport(code, exports) {
	if (exports.find(({ n }) => n === 'Content')) return code;
	const hasComponents = exports.find(({ n }) => n === 'components');
	const usesAstroImage = exports.find(({ n }) => n === USES_ASTRO_IMAGE_FLAG);
	let componentsCode = `{ Fragment: _Fragment${hasComponents ? ', ...components' : ''}, ...props.components,`;
	if (usesAstroImage) {
		componentsCode += ` ${JSON.stringify(ASTRO_IMAGE_ELEMENT)}: ${hasComponents ? 'components.img ?? ' : ''} props.components?.img ?? ${ASTRO_IMAGE_IMPORT}`;
	}
	componentsCode += ' }';
	code = code.replace('export default function MDXContent', 'function MDXContent');
	code += `
export const Content = (props = {}) => MDXContent({
  ...props,
  components: ${componentsCode},
});
export default Content;`;
	return code;
}
function annotateContentExport(code, id, ssr, imports) {
	code += `
Content[Symbol.for('mdx-component')] = true`;
	code += `
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);`;
	code += `
Content.moduleId = ${JSON.stringify(id)};`;
	if (ssr) {
		if (
			!isSpecifierImported(
				code,
				imports,
				astroTagComponentImportRegex,
				'astro/runtime/server/index.js',
			)
		) {
			code += `
import { __astro_tag_component__ } from 'astro/runtime/server/index.js';`;
		}
		code += `
__astro_tag_component__(Content, 'astro:jsx');`;
	}
	return code;
}
function isSpecifierImported(code, imports, specifierRegex, source) {
	for (const imp of imports) {
		if (imp.n !== source) continue;
		const importStatement = code.slice(imp.ss, imp.se);
		if (specifierRegex.test(importStatement)) return true;
	}
	return false;
}
export {
	annotateContentExport,
	injectMetadataExports,
	injectUnderscoreFragmentImport,
	isSpecifierImported,
	transformContentExport,
	vitePluginMdxPostprocess,
};
