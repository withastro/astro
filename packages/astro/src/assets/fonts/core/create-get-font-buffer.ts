import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RuntimeFontFetcher } from './../definitions.js';

export function createGetFontBuffer({
	runtimeFontFetcher,
}: {
	runtimeFontFetcher?: RuntimeFontFetcher;
}) {
	return async function getFontBuffer(url: string, requestUrl?: URL): Promise<ArrayBuffer> {
		// TODO: remove once fonts are stabilized
		if (!runtimeFontFetcher) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		try {
			const buffer = await runtimeFontFetcher.fetch(url, requestUrl);
			if (buffer === null) {
				throw new Error('not found');
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
