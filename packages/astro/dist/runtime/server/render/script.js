import { createRenderInstruction } from './instruction.js';
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = '';
	if (inlined != null) {
		if (inlined) {
			content = `<script type="module">${inlined}</script>`;
		}
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === '/' ? '' : result.base) + result.userAssetsBase : ''}${resolved}"></script>`;
	}
	return createRenderInstruction({ type: 'script', id, content });
}
export { renderScript };
