import type { SvgOptimizer } from './types.js';
import { type Config } from 'svgo';
/** SVG optimizer using [SVGO](https://svgo.dev/). */
export declare function svgoOptimizer(config?: Config): SvgOptimizer;
