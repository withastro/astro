import type { RemotePattern } from '@astrojs/internal-helpers/remote';
import type {
	MarkdownProcessor,
	ShikiConfig,
	Smartypants,
	SyntaxHighlightConfig,
	SyntaxHighlightConfigType,
} from '@astrojs/markdown-satteri';
import type { PluggableList } from 'unified';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

export {
	extractFrontmatter,
	isFrontmatterValid,
	parseFrontmatter,
	type ParseFrontmatterOptions,
	type ParseFrontmatterResult,
} from './frontmatter.js';

/**
 * Configuration that ends up on `markdown.processor`. Returned by factory functions like
 * `satteri()` or `unified()`. Third-party processors implement this interface to plug in
 * their own markdown rendering pipeline.
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
	createRenderer(shared: SharedMarkdownConfig): Promise<MarkdownProcessor>;
	/**
	 * Create the runtime renderer for `.mdx` files. Optional — when absent, `@astrojs/mdx`
	 * falls back to its built-in handling for the known `satteri` and `unified` processor
	 * names. Third-party processors should provide this to enable MDX support.
	 */
	createMdxRenderer?(
		shared: SharedMarkdownConfig,
		mdx: MdxRendererOptions,
	): Promise<MdxRenderer>;
}

/** Markdown config fields that apply to every processor regardless of flavor. */
export interface SharedMarkdownConfig {
	syntaxHighlight?: SyntaxHighlightConfig | SyntaxHighlightConfigType | false;
	shikiConfig?: ShikiConfig;
	gfm?: boolean;
	smartypants?: Smartypants | boolean;
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
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
	astroMetadata: MdxAstroMetadata;
}

/** Shape mirrored from `PluginMetadata['astro']` so MDX results plug into Vite's `meta.astro`. */
export type MdxAstroMetadata = PluginMetadata['astro'];
