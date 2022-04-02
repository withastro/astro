import type * as unified from 'unified';
import type { Node } from 'unist';
import type { ILanguageRegistration, IThemeRegistration, Theme } from 'shiki';
import { BUNDLED_THEMES } from 'shiki';
import { z } from 'zod';

export { Node };
export type PluginFunction<PluginParameters extends any[] = any[], Input = Node, Output = Input> = unified.Plugin<PluginParameters, Input, Output>;

const plugin = z.union([
	z.string(),
	z.tuple([z.string(), z.any()]),
	z.custom<PluginFunction>((data) => typeof data === 'function'),
	z.tuple([z.custom<PluginFunction>((data) => typeof data === 'function'), z.any()]),
]);

export type Plugin = z.infer<typeof plugin>;

const shikiConfig = z.object({
	langs: z.custom<ILanguageRegistration>().array().default([]),
	theme: z
		.enum(BUNDLED_THEMES as [Theme, ...Theme[]])
		.or(z.custom<IThemeRegistration>())
		.default('github-dark'),
	wrap: z.boolean().or(z.null()).default(false),
});

export type ShikiConfig = z.infer<typeof shikiConfig>;

export const astroMarkdownOptions = z.object({
	mode: z.enum(['md', 'mdx']).default('mdx'),
	drafts: z.boolean().default(false),
	syntaxHighlight: z.union([z.literal('shiki'), z.literal('prism'), z.literal(false)]).default('shiki'),
	shikiConfig: shikiConfig.default({}),
	remarkPlugins: plugin.array().default([]),
	rehypePlugins: plugin.array().default([]),
});

export type AstroMarkdownOptions = z.infer<typeof astroMarkdownOptions>;

export interface MarkdownRenderingOptions extends Partial<AstroMarkdownOptions> {
	/** @internal */
	$?: {
		scopedClassName: string | null;
	};
}
