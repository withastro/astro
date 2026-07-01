// Embedding in our own template literal expression requires escaping
// any meaningful template literal characters in the user's code!
const NEEDS_ESCAPE_RE = /[`\\]|\$\{/g;

export function needsEscape(value: any): value is string {
	// Reset the RegExp's global state
	NEEDS_ESCAPE_RE.lastIndex = 0;
	return typeof value === 'string' && NEEDS_ESCAPE_RE.test(value);
}

export function escapeTemplateLiteralCharacters(value: string) {
	// Reset the RegExp's global state
	NEEDS_ESCAPE_RE.lastIndex = 0;

	let char: string | undefined;
	let startIndex = 0;
	let segment = '';
	let text = '';

	// Rather than a naive `String.replace()`, we have to iterate through
	// the raw contents to properly handle existing backslashes
	while (([char] = NEEDS_ESCAPE_RE.exec(value) ?? [])) {
		// Final loop when char === undefined, append trailing content
		if (!char) {
			text += value.slice(startIndex);
			break;
		}
		const endIndex = NEEDS_ESCAPE_RE.lastIndex - char.length;
		const prefix = segment === '\\' ? '' : '\\';
		segment = prefix + char;
		text += value.slice(startIndex, endIndex) + segment;
		startIndex = NEEDS_ESCAPE_RE.lastIndex;
	}
	return text;
}
