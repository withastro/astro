import type {
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
} from '@astrojs/internal-helpers/markdown';
import type { PluggableList } from 'unified';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

export {
	extractFrontmatter,
	isFrontmatterValid,
	parseFrontmatter,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
} from '@astrojs/internal-helpers/frontmatter';
export { resolvePath } from '../core/viteUtils.js';
export type { AstroMarkdownProcessorOptions } from '@astrojs/internal-helpers/markdown';

/** MDX rendering metadata produced by `createMdxRenderer` and surfaced on Vite's `meta.astro`. */
export type AstroMetadata = PluginMetadata['astro'];

/**
 * Configuration that ends up on `markdown.processor`. Returned by factory functions like
 * `unified()`. Third-party processors implement this interface to plug in their own
 * markdown rendering pipeline.
 */
export interface MarkdownProcessorEntry<
	TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
	/** Identifier for this processor. Used by integrations to look up built-in MDX support. */
	readonly name: string;
	/**
	 * Processor-specific options.
	 */
	options?: TOptions;
	/** Create the runtime renderer for `.md` files. */
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
	/**
	 * Create the runtime renderer for `.mdx` files. Optional — when absent, `@astrojs/mdx`
	 * falls back to its built-in handling for the known `unified` processor name.
	 * Third-party processors should provide this to enable MDX support.
	 */
	createMdxRenderer?(
		shared: AstroMarkdownProcessorOptions,
		mdx: MdxRendererOptions,
	): Promise<MdxRenderer>;
}

/** Cross-cutting MDX options passed to `createMdxRenderer` regardless of processor. */
export interface MdxRendererOptions {
	optimize: boolean | { ignoreElementNames?: string[] };
	recmaPlugins: PluggableList;
}

/** Runtime renderer for `.mdx` files returned by `createMdxRenderer`. */
export interface MdxRenderer {
	process(
		content: string,
		filePath: string,
		frontmatter: Record<string, any>,
	): Promise<MdxRenderResult>;
}

export interface MdxRenderResult {
	code: string;
	/** Source map. Stringified to satisfy Vite's `SourceMapInput`. */
	map?: string | null;
	astroMetadata: AstroMetadata;
}
