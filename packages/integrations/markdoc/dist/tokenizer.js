import Markdoc from '@markdoc/markdoc';
function getMarkdocTokenizer(options) {
	const key = cacheKey(options);
	if (!_cachedMarkdocTokenizers[key]) {
		const tokenizerOptions = {
			// Strip <!-- comments --> from rendered output
			// Without this, they're rendered as strings!
			allowComments: true,
		};
		if (options?.allowHTML) {
			tokenizerOptions.allowIndentation = true;
			tokenizerOptions.html = true;
		}
		if (options?.ignoreIndentation) {
			tokenizerOptions.allowIndentation = true;
		}
		if (options?.typographer) {
			tokenizerOptions.typographer = options.typographer;
		}
		_cachedMarkdocTokenizers[key] = new Markdoc.Tokenizer(tokenizerOptions);
	}
	return _cachedMarkdocTokenizers[key];
}
let _cachedMarkdocTokenizers = {};
function cacheKey(options) {
	return JSON.stringify(options);
}
export { getMarkdocTokenizer };
