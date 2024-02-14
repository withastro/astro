import type { SSRResult } from '../../../@types/astro.js';
import { markHTMLString } from '../escape.js';

/**
 * Relies on the `renderScript: true` compiler option
 * @experimental
 */
export async function renderScript(result: SSRResult, id: string) {
	const inlined = result.inlinedScripts.get(id);
	if (inlined) {
		return markHTMLString(`<script type="module">${inlined}</script>`);
	}

	const resolved = await result.resolve(id);
	return markHTMLString(`<script src="${resolved}"></script>`);
}
