import type { SvgOptimizer } from './types.js';
import type { Config } from 'svgo';

/** SVG optimizer using [SVGO](https://svgo.dev/). */
export function svgoOptimizer(config?: Config): SvgOptimizer {
	return {
		name: 'svgo',
		optimize: async (contents, path) => {
			// Loaded lazily so importing `astro/config` doesn't pull in SVGO and its dependencies.
			const { optimize } = await import('svgo');
			return optimize(contents, { ...config, path }).data;
		},
	};
}
