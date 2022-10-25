import type { TransformResult } from '@astrojs/compiler';
import type { PropagationHint } from '../@types/astro';
import type { AstroConfig } from '../@types/astro';

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		scripts: TransformResult['scripts'];
		propagation: PropagationHint;
		output?: Omit<AstroConfig['output'], 'hybrid'>
	};
}
