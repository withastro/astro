import type { AssetsPrefix } from '../../core/app/types.js';

export function getAssetsPrefix(fileType: string, assetsPrefix?: AssetsPrefix): string {
	if (!assetsPrefix) return '';
	if (typeof assetsPrefix === 'string') return assetsPrefix;
	fileType = fileType[0] === '.' ? fileType.slice(1) : fileType;
	if (assetsPrefix[fileType]) {
		return assetsPrefix[fileType];
	} else if (assetsPrefix.fallback) {
		return assetsPrefix.fallback;
	}
	return '';
}
