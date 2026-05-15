import type { FontTypeExtractor } from '../definitions.js';
import type { FontType } from '../types.js';
export declare class NodeFontTypeExtractor implements FontTypeExtractor {
	extract(url: string): FontType;
}
