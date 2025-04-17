import xxhash from 'xxhash-wasm';
import type { Hasher } from '../definitions.js';
import { sortObjectByKey } from '../utils.js';

export class XxHasher implements Hasher {
	private constructor(public hashString: Hasher['hashString']) {}

	static async create() {
		const { h64ToString } = await xxhash();
		return new XxHasher(h64ToString);
	}

	hashObject(input: Record<string, any>): string {
		// TODO: needs to be deep
		return this.hashString(JSON.stringify(sortObjectByKey(input)));
	}
}
