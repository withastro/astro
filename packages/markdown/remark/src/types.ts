import type * as unified from 'unified';
import type * as mdast from 'mdast';
import type * as hast from 'hast';
import type { Node } from 'unist';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';

export { Node };

export type RemarkPlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	Node<mdast.Root>
>;

export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	Node<hast.Root>
>;

export interface ShikiConfig {
	langs: ILanguageRegistration[];
	theme: Theme | IThemeRegistration;
	wrap: boolean | null;
}

export interface AstroMarkdownOptions {
	mode: 'md' | 'mdx';
	drafts: boolean;
	syntaxHighlight: 'shiki' | 'prism' | false;
	shikiConfig: ShikiConfig;
	remarkPlugins: (string | [string, any] | RemarkPlugin | [RemarkPlugin, any])[];
	rehypePlugins: (string | [string, any] | RehypePlugin | [RehypePlugin, any])[];
}

export interface MarkdownRenderingOptions extends AstroMarkdownOptions {
	/** @internal */
	$?: {
		scopedClassName: string | null;
	};
}
