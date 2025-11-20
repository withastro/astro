import xxhash from 'xxhash-wasm';
import type { Hasher } from '../definitions.js';
import { sortObjectByKey } from '../utils.js';

export async function createXxHasher(): Promise<Hasher> {
	const { h64ToString: hashString } = await xxhash();
	return {
		hashString,
		hashObject(input) {
			return hashString(JSON.stringify(sortObjectByKey(input)));
		},
	};
}
