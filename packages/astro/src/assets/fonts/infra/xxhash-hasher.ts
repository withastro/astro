import xxhash from 'xxhash-wasm';
import type { Hasher } from '../definitions.js';
import { sortObjectByKey } from '../utils.js';

export class XxhashHasher implements Hasher {
	hashString: (input: string) => string;

	private constructor(hashString: (input: string) => string) {
		this.hashString = hashString;
	}

	static async create() {
		const { h64ToString } = await xxhash();
		return new XxhashHasher(h64ToString);
	}

	hashObject(input: Record<string, any>): string {
		return this.hashString(JSON.stringify(sortObjectByKey(input)));
	}
}
