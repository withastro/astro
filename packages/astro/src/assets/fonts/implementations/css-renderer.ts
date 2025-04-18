import type { CssRenderer } from '../definitions.js';
import { renderFontFace } from '../utils.js';

// TODO: better impl
export class PrettyCssRenderer implements CssRenderer {
	generateFontFace(family: string, properties: Record<string, string | undefined>): string {
		return renderFontFace({
			'font-family': family,
			...properties,
		});
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return `:root { ${key}: ${values.join(', ')}; }`;
	}
}

// TODO: MinifiedCssRenderer
