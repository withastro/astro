import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
function createGetFontFileURL(runtimeFontFileUrlResolver) {
	return function getFontFileURL(url, requestUrl) {
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
export { createGetFontFileURL };
