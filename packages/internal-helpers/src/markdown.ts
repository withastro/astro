import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type { Options as SmartypantsOptions } from 'retext-smartypants';
import type {
	BuiltinTheme,
	HighlighterCoreOptions,
	LanguageRegistration,
	ShikiTransformer,
	ThemeRegistration,
	ThemeRegistrationRaw,
} from 'shiki';
import type { PluggableList, Plugin } from 'unified';
import type { RemotePattern } from './remote.js';

// Processor-agnostic markdown contract types, shared between `astro` and the
// markdown processor packages. They live here because `astro` depends on the
// processor packages, so the shared types must sit below all of them.

export type SyntaxHighlightConfigType = 'shiki' | 'prism';

export interface SyntaxHighlightConfig {
	type: SyntaxHighlightConfigType;
	excludeLangs?: string[];
}

type ThemePresets = BuiltinTheme | 'css-variables';

export interface ShikiConfig {
	langs?: LanguageRegistration[];
	theme?: ThemePresets | ThemeRegistration | ThemeRegistrationRaw;
	themes?: Record<string, ThemePresets | ThemeRegistration | ThemeRegistrationRaw>;
	langAlias?: HighlighterCoreOptions['langAlias'];
	defaultColor?: 'light' | 'dark' | string | false;
	wrap?: boolean | null;
	transformers?: ShikiTransformer[];
}

export type Smartypants = SmartypantsOptions;

// Plugin/option shapes for the deprecated `markdown.remarkPlugins` /
// `rehypePlugins` / `remarkRehype` config fields.

export type RemarkPlugin<PluginParameters extends any[] = any[]> = Plugin<
	PluginParameters,
	mdast.Root
>;
export type RemarkPlugins = (string | [string, any] | RemarkPlugin | [RemarkPlugin, any])[];
export type RehypePlugin<PluginParameters extends any[] = any[]> = Plugin<
	PluginParameters,
	hast.Root
>;
export type RehypePlugins = (string | [string, any] | RehypePlugin | [RehypePlugin, any])[];
export type RemarkRehype = Record<string, unknown>;

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

/**
 * Shared markdown configuration that lives on `config.markdown.*`. Passed into
 * `MarkdownProcessor.createRenderer` so each processor can honour cross-cutting
 * options (syntax highlighting, images, …) regardless of which processor is selected.
 */
export interface AstroMarkdownOptions {
	syntaxHighlight?: SyntaxHighlightConfig | SyntaxHighlightConfigType | false;
	shikiConfig?: ShikiConfig;
	/** @deprecated Configure via the processor instead, e.g. `unified({ gfm: false })` or `satteri({ features: { gfm: false } })`. */
	gfm?: boolean;
	/** @deprecated Configure via the processor instead, e.g. `unified({ smartypants: false })` or `satteri({ features: { smartPunctuation: false } })`. */
	smartypants?: boolean | SmartypantsOptions;
	/** @deprecated Use `markdown.processor: unified({ remarkPlugins })` instead. */
	remarkPlugins?: RemarkPlugins;
	/** @deprecated Use `markdown.processor: unified({ rehypePlugins })` instead. */
	rehypePlugins?: RehypePlugins;
	/** @deprecated Use `markdown.processor: unified({ remarkRehype })` instead. */
	remarkRehype?: RemarkRehype;
	image?: {
		domains?: string[];
		remotePatterns?: RemotePattern[];
	};
}

/** Runtime renderer for `.md` files. Returned by `MarkdownProcessor.createRenderer`. */
export interface MarkdownRenderer {
	render: (content: string, opts?: MarkdownRenderOptions) => Promise<MarkdownRenderResult>;
}

export interface MarkdownRenderOptions {
	fileURL?: URL;
	frontmatter?: Record<string, any>;
}

export interface MarkdownRenderResult {
	code: string;
	metadata: {
		headings: MarkdownHeading[];
		localImagePaths: string[];
		remoteImagePaths: string[];
		frontmatter: Record<string, any>;
	};
}

/**
 * The processor placed on `config.markdown.processor`. Factory functions like
 * `unified()` / `satteri()` return one of these; third-party processors can
 * implement the interface to plug in their own markdown rendering pipeline.
 *
 * `TOptions` is the processor-specific options bag (e.g. `UnifiedProcessorOptions`).
 * Integrations extend the pipeline by mutating `processor.options.*` directly.
 */
export interface MarkdownProcessor<TOptions extends object = object> {
	/** Identifier for this processor. Used by integrations to look up built-in MDX support. */
	readonly name: string;
	/** Processor-specific options. Always present; pass `{}` for processors that take no options. */
	options: TOptions;
	/** Create the runtime renderer for `.md` files. */
	createRenderer(shared: AstroMarkdownOptions): Promise<MarkdownRenderer>;
	/**
	 * Create the runtime renderer for `.mdx` files. Optional — when absent, `@astrojs/mdx`
	 * falls back to its built-in handling for the known `unified` / `satteri` processor names.
	 * Third-party processors should provide this to enable MDX support.
	 */
	createMdxRenderer?(shared: AstroMarkdownOptions, mdx: MdxRendererOptions): Promise<MdxRenderer>;
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

// MDX rendering metadata. Produced by `@astrojs/mdx`'s Sätteri and unified pipelines
// and surfaced on Vite's `meta.astro`; defined here so both pipelines share one shape.

export interface AstroComponentMetadata {
	exportName: string;
	localName: string;
	specifier: string;
	resolvedPath: string;
}

// Fields are typed permissively so the shape accepts both:
//  - the strict invariant the satteri MDX pipeline produces (no scripts, propagation 'none', …)
//  - the broader output of `@astrojs/compiler` consumed by the unified MDX pipeline.
// The compiler's exact types aren't imported here to keep internal-helpers light.
export interface AstroMetadata {
	hydratedComponents: AstroComponentMetadata[];
	clientOnlyComponents: AstroComponentMetadata[];
	serverComponents: AstroComponentMetadata[];
	scripts: unknown[];
	propagation: string;
	containsHead: boolean;
	pageOptions: object;
}

// Languages never syntax-highlighted by default (e.g. `math`, handled elsewhere).
export const defaultExcludeLanguages = ['math'];

export const syntaxHighlightDefaults: Required<SyntaxHighlightConfig> = {
	type: 'shiki',
	excludeLangs: defaultExcludeLanguages,
};

/** Default values for the markdown config, regardless of processor. */
export const markdownConfigDefaults: Required<Omit<AstroMarkdownOptions, 'image'>> = {
	syntaxHighlight: syntaxHighlightDefaults,
	shikiConfig: {
		langs: [],
		theme: 'github-dark',
		themes: {},
		wrap: false,
		transformers: [],
		langAlias: {},
	},
	gfm: true,
	smartypants: true,
	remarkPlugins: [],
	rehypePlugins: [],
	remarkRehype: {},
};
