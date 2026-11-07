import type { SvgOptimizer } from './types.js';
import type { Config } from 'svgo';

/** SVG optimizer using [SVGO](https://svgo.dev/). */
export function svgoOptimizer(config?: Config): SvgOptimizer {
	return {
		name: 'svgo',
		optimize: async (contents, path) => {
			// `astro/config` re-exports this factory, so a static import would load SVGO
			// and its dependencies on every command, even for projects that never optimize an SVG.
			const { optimize } = await import('svgo');
			return optimize(contents, { ...config, path }).data;
		},
	};
}
