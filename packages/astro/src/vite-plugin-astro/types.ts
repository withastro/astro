import type { TransformResult } from '@astrojs/compiler';
import type { PropagationHint } from '../@types/astro.js';

export interface PageOptions {
	prerender?: boolean;
}

export interface PluginMetadata {
	astro: {
		hydratedComponents: TransformResult['hydratedComponents'];
		clientOnlyComponents: TransformResult['clientOnlyComponents'];
		scripts: TransformResult['scripts'];
		containsHead: TransformResult['containsHead'];
		propagation: PropagationHint;
		pageOptions: PageOptions;
	};
}
