import { isAbsolute } from 'node:path';
import type { Storage } from 'unstorage';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontFetcher } from '../definitions.js';
import { cache } from '../utils.js';

export function createCachedFontFetcher({
	storage,
	fetch,
	readFile,
}: {
	storage: Storage;
	fetch: (url: string, init?: RequestInit) => Promise<Response>;
	readFile: (url: string) => Promise<Buffer>;
}): FontFetcher {
	return {
		async fetch({ hash, url, init }) {
			return await cache(storage, hash, async () => {
				try {
					if (isAbsolute(url)) {
						return await readFile(url);
					}
					const response = await fetch(url, init ?? undefined);
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
		},
	};
}
