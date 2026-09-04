import type { SSRResult } from '../../../types/public/internal.js';
import { createRenderInstruction } from './instruction.js';
import { getDevServerBase } from '../../../core/app/dev-base.js';

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
		const userAssetsBase = result.userAssetsBase
			? (result.base === '/' ? '' : result.base) + result.userAssetsBase
			: '';
		const prefix =
			userAssetsBase && !resolved.startsWith(getDevServerBase(result.base, result.userAssetsBase))
				? userAssetsBase
				: '';
		content = `<script type="module" src="${prefix}${resolved}"></script>`;
	}

	return createRenderInstruction({ type: 'script', id, content });
}
