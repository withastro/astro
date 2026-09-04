import type { SvgOptimizer } from './types.js';
import { optimize, type Config } from 'svgo';

/** SVG optimizer using [SVGO](https://svgo.dev/). */
export function svgoOptimizer(config?: Config): SvgOptimizer {
	return {
		name: 'svgo',
		optimize: (contents, path) => optimize(contents, { ...config, path }).data,
	};
}
