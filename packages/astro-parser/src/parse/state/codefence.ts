// @ts-nocheck
import { Parser } from '../index.js';

export default function codefence(parser: Parser) {
	const start = parser.index;
	const open = parser.match_regex(/[`~]{3,}/);
	parser.index += open!.length;

	let raw = open + '';

	while (parser.index < parser.template.length && !parser.match(open)) {
		raw += parser.template[parser.index++];
	}

	parser.eat(open, true);
	raw += open;
	const trailingWhitespace = parser.read_until(/\S/);
	const { metadata, data } = extractCodeFence(raw);

	const node = {
		start,
		end: parser.index,
		type: 'CodeFence',
		raw: `${raw}` + trailingWhitespace,
		metadata,
		data,
	};

	parser.current().children.push(node);
}

/** Extract attributes on first line */
function extractCodeFence(str: string) {
	const [_, leadingLine] = str.match(/(^[^\n]*\r?\n)/m) ?? ['', ''];
	const metadata = leadingLine.trim();
	const data = str.slice(leadingLine.length);
	return { metadata, data };
}
