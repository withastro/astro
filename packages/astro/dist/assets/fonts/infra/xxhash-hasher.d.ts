import type { Hasher } from '../definitions.js';
export declare class XxhashHasher implements Hasher {
	hashString: (input: string) => string;
	private constructor();
	static create(): Promise<XxhashHasher>;
	hashObject(input: Record<string, any>): string;
}
