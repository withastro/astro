import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { FontDataByCssVariable } from '../types.js';

export function createGetFontData({
	fontDataByCssVariable,
}: {
	fontDataByCssVariable?: FontDataByCssVariable;
}) {
	return function getFontData(cssVariable: string) {
		// TODO: remove once fonts are stabilized
		if (!fontDataByCssVariable) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		const data = fontDataByCssVariable.get(cssVariable);
		if (!data) {
			throw new AstroError({
				...AstroErrorData.FontFamilyNotFound,
				message: AstroErrorData.FontFamilyNotFound.message(cssVariable),
			});
		}
		return data;
	};
}
