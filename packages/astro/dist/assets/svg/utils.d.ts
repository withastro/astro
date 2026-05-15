import type { ImageMetadata } from '../types.js';
import type { SvgOptimizer } from './types.js';
export declare function makeSvgComponent(
	meta: ImageMetadata,
	contents: Buffer | string,
	svgOptimizer: SvgOptimizer | undefined,
): Promise<string>;
