import type { FontFetcher, Storage } from '../definitions.js';
import type { FontFileData } from '../types.js';
export declare class CachedFontFetcher implements FontFetcher {
	#private;
	constructor({
		storage,
		fetch,
		readFile,
	}: {
		storage: Storage;
		fetch: (url: string, init?: RequestInit) => Promise<Response>;
		readFile: (url: string) => Promise<Buffer>;
	});
	fetch({ id, url, init }: FontFileData): Promise<Buffer>;
}
