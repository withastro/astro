import { PROPAGATED_ASSET_FLAG } from '../../content/consts.js';
function isPropagatedAssetBoundary(id) {
	try {
		return new URL(id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}
export { isPropagatedAssetBoundary };
