import type { FontDataByCssVariable, FontFamilyAssets } from '../types.js';
export declare function collectFontData(
	fontFamilyAssets: Array<
		Pick<FontFamilyAssets, 'fonts'> & {
			family: Pick<FontFamilyAssets['family'], 'cssVariable'>;
		}
	>,
): FontDataByCssVariable;
