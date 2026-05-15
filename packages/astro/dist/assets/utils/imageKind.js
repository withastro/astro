function isESMImportedImage(src) {
	return typeof src === 'object' || (typeof src === 'function' && 'src' in src);
}
function isRemoteImage(src) {
	return typeof src === 'string';
}
async function resolveSrc(src) {
	if (typeof src === 'object' && 'then' in src) {
		const resource = await src;
		return resource.default ?? resource;
	}
	return src;
}
export { isESMImportedImage, isRemoteImage, resolveSrc };
