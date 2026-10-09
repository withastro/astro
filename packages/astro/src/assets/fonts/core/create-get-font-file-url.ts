import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { RuntimeFontFileUrlResolver } from '../definitions.js';

export function createGetFontFileURL(runtimeFontFileUrlResolver: RuntimeFontFileUrlResolver) {
	return function getFontFileURL(url: string, requestUrl?: URL): string {
		try {
			const result = runtimeFontFileUrlResolver.resolve(url, requestUrl);
			if (result === null) {
				throw new Error('Not found');
			}
			return result;
		} catch (cause) {
			throw new AstroError(
				{
					...AstroErrorData.FontFileUrlNotFound,
					message: AstroErrorData.FontFileUrlNotFound.message(url),
				},
				{ cause },
			);
		}
	};
}
