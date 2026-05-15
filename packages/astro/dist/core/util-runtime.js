function isObject(value) {
	return typeof value === 'object' && value != null;
}
function isURL(value) {
	return Object.prototype.toString.call(value) === '[object URL]';
}
function arraify(target) {
	return Array.isArray(target) ? target : [target];
}
function padMultilineString(source, n = 2) {
	const lines = source.split(/\r?\n/);
	return lines.map((l) => ` `.repeat(n) + l).join(`
`);
}
export { arraify, isObject, isURL, padMultilineString };
