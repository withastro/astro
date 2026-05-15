import type { FontFileContentResolver } from '../definitions.js';
type ReadFileSync = (path: string) => string;
export declare class FsFontFileContentResolver implements FontFileContentResolver {
	#private;
	constructor({ readFileSync }: { readFileSync: ReadFileSync });
	resolve(url: string): string;
}
export {};
