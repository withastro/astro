import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RuntimeFontFetcher } from './../definitions.js';

export function createGetFontBuffer(runtimeFontFetcher: RuntimeFontFetcher) {
	return async function getFontBuffer(url: string, requestUrl?: URL): Promise<ArrayBuffer> {
		try {
			const buffer = await runtimeFontFetcher.fetch(url, requestUrl);
			if (buffer === null) {
				throw new Error('Not found');
			}
			return buffer;
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.FontBufferNotFound,
					message: AstroErrorData.FontBufferNotFound.message(url),
				},
				{ cause },
			);
		}
	};
}
