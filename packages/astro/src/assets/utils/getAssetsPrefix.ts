import type { AssetsPrefix } from '../../core/app/types.js';

export function getAssetsPrefix(fileExtension: string, assetsPrefix?: AssetsPrefix): string {
	let prefix = '';
	if (!assetsPrefix) {
		prefix = '';
	} else if (typeof assetsPrefix === 'string') {
		prefix = assetsPrefix;
	} else {
		// we assume the file extension has a leading '.' and we remove it
		const dotLessFileExtension = fileExtension.slice(1);
		prefix = assetsPrefix[dotLessFileExtension] || assetsPrefix.fallback;
	}

	return prefix;
}
