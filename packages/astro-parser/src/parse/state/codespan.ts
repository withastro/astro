// @ts-nocheck
import { Parser } from '../index.js';

export default function codespan(parser: Parser) {
	const start = parser.index;
	const open = parser.match_regex(/(?<!\\)`{1,2}/);
	parser.index += open!.length;

	let raw = open;
	while (parser.index < parser.template.length && !parser.match(open)) {
		raw += parser.template[parser.index++];
	}
	parser.eat(open, true);
	raw += open;

	const node = {
		start,
		end: parser.index,
		type: 'CodeSpan',
		raw,
		data: raw
			?.slice(open?.length, open?.length * -1)
			.replace(/^ /, '')
			.replace(/ $/, ''),
	};

	parser.current().children.push(node);
}
