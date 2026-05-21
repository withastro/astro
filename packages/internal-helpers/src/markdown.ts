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
import type { Plugin } from 'unified';
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

export interface AstroMarkdownProcessorOptions {
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

export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions,
	) => Promise<MarkdownProcessorRenderResult>;
}

export interface MarkdownProcessorRenderOptions {
	fileURL?: URL;
	frontmatter?: Record<string, any>;
}

export interface MarkdownProcessorRenderResult {
	code: string;
	metadata: {
		headings: MarkdownHeading[];
		localImagePaths: string[];
		remoteImagePaths: string[];
		frontmatter: Record<string, any>;
	};
}

// MDX rendering metadata. Produced by `@astrojs/mdx`'s satteri and unified pipelines
// and surfaced on Vite's `meta.astro`; defined here so both pipelines share one shape.

export interface AstroComponentMetadata {
	exportName: string;
	localName: string;
	specifier: string;
	resolvedPath: string;
}

export interface AstroMetadata {
	hydratedComponents: AstroComponentMetadata[];
	clientOnlyComponents: AstroComponentMetadata[];
	serverComponents: AstroComponentMetadata[];
	scripts: never[];
	propagation: 'none';
	containsHead: false;
	pageOptions: Record<string, never>;
}

export function createDefaultAstroMetadata(): AstroMetadata {
	return {
		hydratedComponents: [],
		clientOnlyComponents: [],
		serverComponents: [],
		scripts: [],
		propagation: 'none',
		containsHead: false,
		pageOptions: {},
	};
}

// Languages never syntax-highlighted by default (e.g. `math`, handled elsewhere).
export const defaultExcludeLanguages = ['math'];

export const syntaxHighlightDefaults: Required<SyntaxHighlightConfig> = {
	type: 'shiki',
	excludeLangs: defaultExcludeLanguages,
};

/** Default values for the markdown config, regardless of processor. */
export const markdownConfigDefaults: Required<Omit<AstroMarkdownProcessorOptions, 'image'>> = {
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
