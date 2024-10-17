import type * as hast from 'hast';
import type * as mdast from 'mdast';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type {
	BuiltinTheme,
	HighlighterCoreOptions,
	LanguageRegistration,
	ShikiTransformer,
	ThemeRegistration,
	ThemeRegistrationRaw,
} from 'shiki';
import type * as unified from 'unified';
import type { DataMap, VFile } from 'vfile';

export type { Node } from 'unist';

export type MarkdownAstroData = {
	frontmatter: Record<string, any>;
};

export type RemarkPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	mdast.Root
>;

export type RemarkPlugins = (string | [string, any] | RemarkPlugin | [RemarkPlugin, any])[];

export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

export type RehypePlugins = (string | [string, any] | RehypePlugin | [RehypePlugin, any])[];

export type RemarkRehype = RemarkRehypeOptions;

export type ThemePresets = BuiltinTheme | 'css-variables';

export interface ShikiConfig {
	langs?: LanguageRegistration[];
	langAlias?: HighlighterCoreOptions['langAlias'];
	theme?: ThemePresets | ThemeRegistration | ThemeRegistrationRaw;
	themes?: Record<string, ThemePresets | ThemeRegistration | ThemeRegistrationRaw>;
	defaultColor?: 'light' | 'dark' | string | false;
	wrap?: boolean | null;
	transformers?: ShikiTransformer[];
}

export interface AstroMarkdownOptions {
	syntaxHighlight?: 'shiki' | 'prism' | false;
	shikiConfig?: ShikiConfig;
	remarkPlugins?: RemarkPlugins;
	rehypePlugins?: RehypePlugins;
	remarkRehype?: RemarkRehype;
	gfm?: boolean;
	smartypants?: boolean;
}

export interface MarkdownProcessor {
	render: (
		content: string,
		opts?: MarkdownProcessorRenderOptions,
	) => Promise<MarkdownProcessorRenderResult>;
}

export interface MarkdownProcessorRenderOptions {
	/** @internal */
	fileURL?: URL;
	/** Used for frontmatter injection plugins */
	frontmatter?: Record<string, any>;
}

export interface MarkdownProcessorRenderResult {
	code: string;
	metadata: {
		headings: MarkdownHeading[];
		imagePaths: Set<string>;
		frontmatter: Record<string, any>;
	};
}

export interface MarkdownHeading {
	depth: number;
	slug: string;
	text: string;
}

// TODO: Remove `MarkdownVFile` and move all additional properties to `DataMap` instead
export interface MarkdownVFile extends VFile {
	data: Record<string, unknown> &
		Partial<DataMap> & {
			__astroHeadings?: MarkdownHeading[];
			imagePaths?: Set<string>;
		};
}
