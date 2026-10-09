import { fileURLToPath } from 'node:url';
import * as unstorage from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';
import type { Storage } from '../definitions.js';

export class UnstorageFsStorage implements Storage {
	readonly #unstorage: unstorage.Storage;

	constructor({ base }: { base: URL }) {
		this.#unstorage = unstorage.createStorage({
			driver: fsLiteDriver({ base: fileURLToPath(base) }),
		});
	}

	async getItem(key: string): Promise<any | null> {
		return await this.#unstorage.getItem(key);
	}

	async getItemRaw(key: string): Promise<Buffer | null> {
		return await this.#unstorage.getItemRaw(key);
	}

	async setItem(key: string, value: any): Promise<void> {
		return await this.#unstorage.setItem(key, value);
	}

	async setItemRaw(key: string, value: any): Promise<void> {
		return await this.#unstorage.setItemRaw(key, value);
	}
}
