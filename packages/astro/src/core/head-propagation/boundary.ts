import { PROPAGATED_ASSET_FLAG } from '../../content/consts.js';

export function isPropagatedAssetBoundary(id: string): boolean {
	try {
		return new URL(id, 'file://').searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}
