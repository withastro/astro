import type { TransformResult } from '@astrojs/compiler';
import type { PropagationHint } from '../@types/astro';

export interface PageOptions {
	prerender?: boolean;
}

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		scripts: TransformResult['scripts'];
		propagation: PropagationHint;
		pageOptions: PageOptions;
	};
}
