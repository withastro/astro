import { createSatteriMarkdownProcessor } from './satteri-processor.js';
import type { AstroMarkdownProcessorOptions, MarkdownProcessor } from './types.js';

export interface SatteriProcessorOptions {
	mdastPlugins?: import('satteri').MdastPluginDefinition[];
	hastPlugins?: import('satteri').HastPluginDefinition[];
	features?: import('satteri').Features;
}

/**
 * The descriptor returned by `satteri()`. Implements `MarkdownProcessorEntry` (astro core's
 * pluggable processor interface) and additionally exposes the satteri-specific plugin lists
 * so the MDX integration can merge them into MDX options.
 */
export interface SatteriProcessorDescriptor {
	readonly name: 'satteri';
	mdastPlugins: import('satteri').MdastPluginDefinition[];
	hastPlugins: import('satteri').HastPluginDefinition[];
	features?: import('satteri').Features;
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
}

export function satteri(opts: SatteriProcessorOptions = {}): SatteriProcessorDescriptor {
	const mdastPlugins = opts.mdastPlugins ?? [];
	const hastPlugins = opts.hastPlugins ?? [];
	const features = opts.features;

	return {
		name: 'satteri',
		mdastPlugins,
		hastPlugins,
		features,
		createRenderer(shared) {
			return createSatteriMarkdownProcessor({
				...shared,
				mdastPlugins,
				hastPlugins,
				features,
			});
		},
	};
}

export function isSatteriProcessor(p: {
	name: string;
}): p is SatteriProcessorDescriptor {
	return p.name === 'satteri';
}
