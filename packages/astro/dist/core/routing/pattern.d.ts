import type { AstroConfig } from '../../types/public/config.js';
import type { RoutePart } from '../../types/public/internal.js';
export declare function getPattern(
	segments: RoutePart[][],
	base: AstroConfig['base'],
	addTrailingSlash: AstroConfig['trailingSlash'],
): RegExp;
