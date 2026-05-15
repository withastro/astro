import xxhash from 'xxhash-wasm';
import { sortObjectByKey } from '../utils.js';
class XxhashHasher {
	hashString;
	constructor(hashString) {
		this.hashString = hashString;
	}
	static async create() {
		const { h64ToString } = await xxhash();
		return new XxhashHasher(h64ToString);
	}
	hashObject(input) {
		return this.hashString(JSON.stringify(sortObjectByKey(input)));
	}
}
export { XxhashHasher };
