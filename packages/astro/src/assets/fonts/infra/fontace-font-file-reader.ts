import { readFileSync } from 'node:fs';
import { fontace } from 'fontace';
import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontFileReader } from '../definitions.js';
import type { Style } from '../types.js';

export function createFontaceFontFileReader(): FontFileReader {
	return {
		extract({ family, url }) {
			try {
				const data = fontace(readFileSync(url));
				return {
					weight: data.weight,
					style: data.style as Style,
				};
			} catch (cause) {
				throw new AstroError(
					{
						...AstroErrorData.CannotDetermineWeightAndStyleFromFontFile,
						message: AstroErrorData.CannotDetermineWeightAndStyleFromFontFile.message(family, url),
					},
					{ cause },
				);
			}
		},
	};
}
