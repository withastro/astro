function getAssetsPrefix(fileExtension, assetsPrefix) {
	let prefix = '';
	if (!assetsPrefix) {
		prefix = '';
	} else if (typeof assetsPrefix === 'string') {
		prefix = assetsPrefix;
	} else {
		const dotLessFileExtension = fileExtension.slice(1);
		prefix = assetsPrefix[dotLessFileExtension] || assetsPrefix.fallback;
	}
	return prefix;
}
export { getAssetsPrefix };
