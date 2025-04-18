import type { FontFaceData } from 'unifont';
import type { CssRenderer } from '../definitions.js';
import { generateFontFace } from '../utils.js';

// TODO: better impl
export class PrettyCssRenderer implements CssRenderer {
	generateFontFace(family: string, font: FontFaceData): string {
		return generateFontFace(family, font);
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return `:root { ${key}: ${values.join(', ')}; }`;
	}
}

// TODO: MinifiedCssRenderer