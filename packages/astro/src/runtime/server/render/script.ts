import type { SSRResult } from '../../../types/public/internal.js';
import { createRenderInstruction } from './instruction.js';

/**
 * Relies on the `renderScript: true` compiler option
 * @experimental
 */
export async function renderScript(result: SSRResult, id: string) {
	const inlined = result.inlinedScripts.get(id);
	let content = '';
	if (inlined != null) {
		// The inlined script may actually be empty, so skip rendering it altogether if so
		if (inlined) {
			content = `<script type="module">${inlined}</script>`;
		}
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === '/' ? '' : result.base) + result.userAssetsBase : ''}${resolved}"></script>`;
	}

	return createRenderInstruction({ type: 'script', id, content });
}
