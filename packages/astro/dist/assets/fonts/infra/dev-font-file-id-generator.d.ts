import type * as unifont from 'unifont';
import type { FontFileContentResolver, FontFileIdGenerator, Hasher } from '../definitions.js';
import type { FontType } from '../types.js';
export declare class DevFontFileIdGenerator implements FontFileIdGenerator {
	#private;
	constructor({
		hasher,
		contentResolver,
	}: {
		hasher: Hasher;
		contentResolver: FontFileContentResolver;
	});
	generate({
		cssVariable,
		originalUrl,
		type,
		font,
	}: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		font: unifont.FontFaceData;
	}): string;
}
