import type { MarkdownProcessor } from '@astrojs/internal-helpers/markdown';
import type { HastPluginEntry, HastPluginList, MdastPluginEntry, MdastPluginList } from 'satteri';
import { createSatteriMarkdownProcessor, type SatteriFeatures } from './satteri-processor.js';

export interface SatteriProcessorOptions {
	mdastPlugins?: MdastPluginList;
	hastPlugins?: HastPluginList;
	features?: SatteriFeatures;
}

/**
 * Resolved options on the processor returned by `satteri()`. Always populated
 * (the factory normalises absent inputs into defaults).
 */
export interface SatteriResolvedOptions {
	mdastPlugins: MdastPluginEntry[];
	hastPlugins: HastPluginEntry[];
	features: SatteriFeatures;
}

/**
 * Use the Sätteri Markdown processor for `markdown.processor`. Extend the pipeline
 * with mdast or hast plugins, or toggle Markdown features.
 *
 * ```js
 * import { satteri } from '@astrojs/markdown-satteri';
 *
 * export default defineConfig({
 *   markdown: {
 *     processor: satteri({ features: { directive: true } }),
 *   },
 * });
 * ```
 */
export function satteri(
	opts: SatteriProcessorOptions = {},
): MarkdownProcessor<SatteriResolvedOptions> {
	const processor: MarkdownProcessor<SatteriResolvedOptions> = {
		name: 'satteri',
		options: {
			mdastPlugins: [...(opts.mdastPlugins ?? [])],
			hastPlugins: [...(opts.hastPlugins ?? [])],
			// Default to `{}` so integrations can write `options.features.gfm = false`
			// without an `??=` check.
			features: { ...opts.features },
		},
		createRenderer(shared) {
			return createSatteriMarkdownProcessor({
				...shared,
				mdastPlugins: processor.options.mdastPlugins,
				hastPlugins: processor.options.hastPlugins,
				features: processor.options.features,
			});
		},
	};
	return processor;
}

export function isSatteriProcessor(p: {
	name: string;
}): p is MarkdownProcessor<SatteriResolvedOptions> {
	return p.name === 'satteri';
}
