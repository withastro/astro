import { extname } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontTypeExtractor } from '../definitions.js';
import { isFontType } from '../utils.js';

export function createFontTypeExtractor(): FontTypeExtractor {
	return {
		extract(url) {
			const extension = extname(url).slice(1);
			if (!isFontType(extension)) {
				throw new AstroError(
					{
						...AstroErrorData.CannotExtractFontType,
						message: AstroErrorData.CannotExtractFontType.message(url),
					},
					{ cause: `Unexpected extension, got "${extension}"` },
				);
			}
			return extension;
		},
	};
}
