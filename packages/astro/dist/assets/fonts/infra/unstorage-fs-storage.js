import { fileURLToPath } from 'node:url';
import * as unstorage from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
class UnstorageFsStorage {
	#unstorage;
	constructor({ base }) {
		this.#unstorage = unstorage.createStorage({
			driver: fsLiteDriver({ base: fileURLToPath(base) }),
		});
	}
	async getItem(key) {
		return await this.#unstorage.getItem(key);
	}
	async getItemRaw(key) {
		return await this.#unstorage.getItemRaw(key);
	}
	async setItem(key, value) {
		return await this.#unstorage.setItem(key, value);
	}
	async setItemRaw(key, value) {
		return await this.#unstorage.setItemRaw(key, value);
	}
}
export { UnstorageFsStorage };
