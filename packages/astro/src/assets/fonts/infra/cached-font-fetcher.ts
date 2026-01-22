import { isAbsolute } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontFetcher, Storage } from '../definitions.js';
import type { FontFileData } from '../types.js';

export class CachedFontFetcher implements FontFetcher {
	readonly #storage: Storage;
	readonly #fetch: (url: string, init?: RequestInit) => Promise<Response>;
	readonly #readFile: (url: string) => Promise<Buffer>;

	constructor({
		storage,
		fetch,
		readFile,
	}: {
		storage: Storage;
		fetch: (url: string, init?: RequestInit) => Promise<Response>;
		readFile: (url: string) => Promise<Buffer>;
	}) {
		this.#storage = storage;
		this.#fetch = fetch;
		this.#readFile = readFile;
	}

	async #cache(storage: Storage, key: string, cb: () => Promise<Buffer>): Promise<Buffer> {
		const existing = await storage.getItemRaw(key);
		if (existing) {
			return existing;
		}
		const data = await cb();
		await storage.setItemRaw(key, data);
		return data;
	}

	async fetch({ id, url, init }: FontFileData): Promise<Buffer> {
		return await this.#cache(this.#storage, id, async () => {
			try {
				if (isAbsolute(url)) {
					return await this.#readFile(url);
				}
				const response = await this.#fetch(url, init ?? undefined);
				if (!response.ok) {
					throw new Error(`Response was not successful, received status code ${response.status}`);
				}
				return Buffer.from(await response.arrayBuffer());
			} catch (cause) {
				throw new AstroError(
					{
						...AstroErrorData.CannotFetchFontFile,
						message: AstroErrorData.CannotFetchFontFile.message(url),
					},
					{ cause },
				);
			}
		});
	}
}
