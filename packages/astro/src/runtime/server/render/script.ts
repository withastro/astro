import type { SSRResult } from '../../../@types/astro.js';
import { markHTMLString } from '../escape.js';

/**
 * Relies on the `renderScript: true` compiler option
 * @experimental
 */
export async function renderScript(result: SSRResult, path: string) {
	const resolved = await result.resolve(path);
	return markHTMLString(`<script type="module" src="${resolved}"></script>`);
}
