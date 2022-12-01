import type { TransformResult } from '@astrojs/compiler';
import type { PropagationHint } from '../@types/astro';

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		scripts: TransformResult['scripts'];
		headInjection: PropagationHint;
	};
}
