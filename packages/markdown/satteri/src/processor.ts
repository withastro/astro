import { createSatteriMarkdownProcessor } from './satteri-processor.js';
import type {
	AstroMarkdownProcessorOptions,
	MarkdownProcessor,
} from '@astrojs/internal-helpers/markdown';
import type { MdastPluginDefinition, HastPluginDefinition, Features } from 'satteri';

export interface SatteriProcessorOptions {
	mdastPlugins?: MdastPluginDefinition[];
	hastPlugins?: HastPluginDefinition[];
	features?: Features;
}

/**
 * The descriptor returned by `satteri()`. Integrations extend the pipeline by mutating
 * `descriptor.options.mdastPlugins` / `hastPlugins` / `features` directly.
 */
export interface SatteriProcessorDescriptor {
	readonly name: 'satteri';
	options: {
		mdastPlugins: MdastPluginDefinition[];
		hastPlugins: HastPluginDefinition[];
		features: Features;
	};
	createRenderer(shared: AstroMarkdownProcessorOptions): Promise<MarkdownProcessor>;
}

export function satteri(opts: SatteriProcessorOptions = {}): SatteriProcessorDescriptor {
	const descriptor: SatteriProcessorDescriptor = {
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
				mdastPlugins: descriptor.options.mdastPlugins,
				hastPlugins: descriptor.options.hastPlugins,
				features: descriptor.options.features,
			});
		},
	};
	return descriptor;
}

export function isSatteriProcessor(p: { name: string }): p is SatteriProcessorDescriptor {
	return p.name === 'satteri';
}
