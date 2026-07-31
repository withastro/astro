import type { SSRResult } from '../../../types/public/internal.js';
import type { RenderScriptInstruction } from './instruction.js';
import { createRenderInstruction } from './instruction.js';

/**
 * Relies on the `renderScript: true` compiler option
 * @experimental
 */
export function renderScript(
	result: SSRResult,
	id: string,
): RenderScriptInstruction | Promise<RenderScriptInstruction> {
	const inlined = result.inlinedScripts.get(id);
	if (inlined != null) {
		const content = inlined ? `<script type="module">${inlined}</script>` : '';
		return createRenderInstruction({ type: 'script', id, content });
	}

	return result.resolve(id).then((resolved) => {
		const content = `<script type="module" src="${result.userAssetsBase ? (result.base === '/' ? '' : result.base) + result.userAssetsBase : ''}${resolved}"></script>`;
		return createRenderInstruction({ type: 'script', id, content });
	});
}
