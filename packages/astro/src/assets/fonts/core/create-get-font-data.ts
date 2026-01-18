import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { ConsumableMap } from '../types.js';

export function createGetFontData({ consumableMap }: { consumableMap?: ConsumableMap }) {
	return function getFontData(cssVariable: string) {
		// TODO: remove once fonts are stabilized
		if (!consumableMap) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		const data = consumableMap.get(cssVariable);
		if (!data) {
			throw new AstroError({
				...AstroErrorData.FontFamilyNotFound,
				message: AstroErrorData.FontFamilyNotFound.message(cssVariable),
			});
		}
		return data;
	};
}
