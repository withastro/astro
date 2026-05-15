import type { FontFileContentResolver, FontFileIdGenerator, Hasher } from '../definitions.js';
import type { FontType } from '../types.js';
export declare class BuildFontFileIdGenerator implements FontFileIdGenerator {
	#private;
	constructor({
		hasher,
		contentResolver,
	}: {
		hasher: Hasher;
		contentResolver: FontFileContentResolver;
	});
	generate({ originalUrl, type }: { originalUrl: string; type: FontType }): string;
}
