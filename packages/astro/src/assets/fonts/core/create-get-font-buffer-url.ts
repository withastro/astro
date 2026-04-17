import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RuntimeFontFileUrlResolver } from '../definitions.js';

export function createGetFontBufferURL(runtimeFontFileUrlResolver: RuntimeFontFileUrlResolver) {
	return function getFontBufferURL(url: string, requestUrl?: URL): string {
		try {
			const result = runtimeFontFileUrlResolver.resolve(url, requestUrl);
			if (result === null) {
				throw new Error('Not found');
			}
			return result;
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.FontBufferUrlNotFound,
					message: AstroErrorData.FontBufferUrlNotFound.message(url),
				},
				{ cause },
			);
		}
	};
}
