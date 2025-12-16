import { isAbsolute } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontFetcher, Storage } from '../definitions.js';
import type { FontFileData } from '../types.js';
import { cache } from '../utils.js';

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

	async fetch({ hash, url, init }: FontFileData): Promise<Buffer> {
		return await cache(this.#storage, hash, async () => {
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
