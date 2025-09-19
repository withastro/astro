import { extname } from 'node:path';
import type { ErrorHandler, FontTypeExtractor } from '../definitions.js';
import { isFontType } from '../utils.js';

export function createFontTypeExtractor({
	errorHandler,
}: {
	errorHandler: ErrorHandler;
}): FontTypeExtractor {
	return {
		extract(url) {
			const extension = extname(url).slice(1);
			if (!isFontType(extension)) {
				throw errorHandler.handle({
					type: 'cannot-extract-font-type',
					data: { url },
					cause: `Unexpected extension, got "${extension}"`,
				});
			}
			return extension;
		},
	};
}
