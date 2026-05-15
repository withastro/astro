const splitAttrsTokenizer = /([${}@\w:\-]*)\s*=\s*?(['"]?)(.*?)\2\s+/g;
function replaceAttribute(s, node, key, newValue) {
	splitAttrsTokenizer.lastIndex = 0;
	const text = s.original
		.slice(node.position?.start.offset ?? 0, node.position?.end.offset ?? 0)
		.toString();
	const offset = text.indexOf(key);
	if (offset === -1) return;
	const start = node.position.start.offset + offset;
	const tokens = text.slice(offset).split(splitAttrsTokenizer);
	const token = tokens[0].replace(/([^>])>[\s\S]*$/gm, '$1');
	if (token.trim() === key) {
		const end = start + key.length;
		return s.overwrite(start, end, newValue, { contentOnly: true });
	} else {
		const length = token.length;
		const end = start + length;
		return s.overwrite(start, end, newValue, { contentOnly: true });
	}
}
const NEEDS_ESCAPE_RE = /[`\\]|\$\{/g;
function needsEscape(value) {
	NEEDS_ESCAPE_RE.lastIndex = 0;
	return typeof value === 'string' && NEEDS_ESCAPE_RE.test(value);
}
function escapeTemplateLiteralCharacters(value) {
	NEEDS_ESCAPE_RE.lastIndex = 0;
	let char;
	let startIndex = 0;
	let segment = '';
	let text = '';
	while (([char] = NEEDS_ESCAPE_RE.exec(value) ?? [])) {
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
export { escapeTemplateLiteralCharacters, needsEscape, replaceAttribute };
