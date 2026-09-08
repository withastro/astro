import { extname } from 'node:path';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontTypeExtractor } from '../definitions.js';
import type { FontType } from '../types.js';
import { isFontType } from '../utils.js';

export class NodeFontTypeExtractor implements FontTypeExtractor {
	extract(url: string): FontType {
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
	}
}
