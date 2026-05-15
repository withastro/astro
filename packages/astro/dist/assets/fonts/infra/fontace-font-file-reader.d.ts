import type { FontFileReader } from '../definitions.js';
import type { Style } from '../types.js';
export declare class FontaceFontFileReader implements FontFileReader {
	extract({ family, url }: { family: string; url: string }): {
		weight: string;
		style: Style;
	};
}
