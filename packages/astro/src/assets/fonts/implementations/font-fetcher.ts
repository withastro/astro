import type { Storage } from 'unstorage';
import type { ErrorHandler, FontFetcher } from '../definitions.js';
import { cache } from '../utils.js';
import { isAbsolute } from 'node:path';
import { readFile } from 'node:fs/promises';

export function createCachedFontFetcher({
	storage,
	errorHandler,
}: { storage: Storage; errorHandler: ErrorHandler }): FontFetcher {
	return {
		async fetch(hash, url) {
			return await cache(storage, hash, async () => {
				try {
					if (isAbsolute(url)) {
						return await readFile(url);
					}
					// TODO: find a way to pass headers
					// https://github.com/unjs/unifont/issues/143
					const response = await fetch(url);
					if (!response.ok) {
						throw new Error(`Response was not successful, received status code ${response.status}`);
					}
					return Buffer.from(await response.arrayBuffer());
				} catch (cause) {
					throw errorHandler.handle({
						type: 'cannot-fetch-font-file',
						data: { url },
						cause,
					});
				}
			});
		},
	};
}
