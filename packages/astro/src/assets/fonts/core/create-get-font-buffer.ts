import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RuntimeFontFetcher } from './../definitions.js';

export function createGetFontBuffer({
	runtimeFontFetcher,
}: {
	runtimeFontFetcher?: RuntimeFontFetcher;
}) {
	return async function getFontBuffer(url: string): Promise<ArrayBuffer> {
		// TODO: remove once fonts are stabilized
		if (!runtimeFontFetcher) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		// Should always be able to split but we default to a hash that will always fail
		const id = url.split('/').pop() ?? '';
		try {
			const buffer = await runtimeFontFetcher.fetch(id);
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
