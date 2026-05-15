import { resolveIdToUrl } from '../core/viteUtils.js';
function createResolve(loader, root) {
	return async function (s) {
		return await resolveIdToUrl(loader, s, root);
	};
}
export { createResolve };
