const regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
const regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
const regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
const DEFAULT_OPTIONS = {
	escapeEverything: false,
	isIdentifier: false,
	quotes: 'single',
	wrap: false,
};
function cssesc(string, options = {}) {
	options = { ...DEFAULT_OPTIONS, ...options };
	const quote = options.quotes === 'double' ? '"' : "'";
	const { isIdentifier } = options;
	const firstChar = string.charAt(0);
	let output = '';
	let counter = 0;
	const length = string.length;
	while (counter < length) {
		const character = string.charAt(counter++);
		let codePoint = character.charCodeAt(0);
		let value;
		if (codePoint < 32 || codePoint > 126) {
			if (codePoint >= 55296 && codePoint <= 56319 && counter < length) {
				const extra = string.charCodeAt(counter++);
				if ((extra & 64512) === 56320) {
					codePoint = ((codePoint & 1023) << 10) + (extra & 1023) + 65536;
				} else {
					counter--;
				}
			}
			value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
		} else {
			if (options.escapeEverything) {
				if (regexAnySingleEscape.test(character)) {
					value = '\\' + character;
				} else {
					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
				}
			} else if (/[\t\n\f\r\x0B]/.test(character)) {
				value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
			} else if (
				character === '\\' ||
				(!isIdentifier &&
					((character === '"' && quote === character) ||
						(character === "'" && quote === character))) ||
				(isIdentifier && regexSingleEscape.test(character))
			) {
				value = '\\' + character;
			} else {
				value = character;
			}
		}
		output += value;
	}
	if (isIdentifier) {
		if (/^-[-\d]/.test(output)) {
			output = '\\-' + output.slice(1);
		} else if (/\d/.test(firstChar)) {
			output = '\\3' + firstChar + ' ' + output.slice(1);
		}
	}
	output = output.replace(regexExcessiveSpaces, function ($0, $1, $2) {
		if ($1 && $1.length % 2) {
			return $0;
		}
		return ($1 || '') + $2;
	});
	if (!isIdentifier && options.wrap) {
		return quote + output + quote;
	}
	return output;
}
export { cssesc as default };
