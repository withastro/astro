import { isAbsolute } from 'node:path';
import type { Storage } from 'unstorage';
import type { ErrorHandler, FontFetcher } from '../definitions.js';
import { cache } from '../utils.js';

export function createCachedFontFetcher({
	storage,
	errorHandler,
	fetch,
	readFile,
}: {
	storage: Storage;
	errorHandler: ErrorHandler;
	fetch: (url: string) => Promise<Response>;
	readFile: (url: string) => Promise<Buffer>;
}): FontFetcher {
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
