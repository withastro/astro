export {
	extractFrontmatter,
	isFrontmatterValid,
	parseFrontmatter,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
} from '@astrojs/internal-helpers/frontmatter';
export { resolvePath } from '../core/viteUtils.js';
export { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
export type {
	AstroMarkdownOptions,
	AstroMetadata,
	MarkdownProcessor,
	MarkdownRenderer,
	MarkdownRenderOptions,
	MarkdownRenderResult,
	MdxRenderer,
	MdxRendererOptions,
	MdxRenderResult,
} from '@astrojs/internal-helpers/markdown';
