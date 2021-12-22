// @ts-nocheck

import { Parser } from '../index.js';

export default function setup(parser: Parser): void {
	// TODO: Error if not at top of file? currently, we ignore / just treat as text.
	// if (parser.html.children.length > 0) {
	//   parser.error({
	//     code: 'unexpected-token',
	//     message: 'Frontmatter scripts only supported at the top of file.',
	//   });
	// }

	const start = parser.index;
	parser.index += 3;
	const content_start = parser.index;
	const setupScriptContent = parser.read_until(/^---/m);
	const content_end = parser.index;
	parser.eat('---', true);
	const end = parser.index;
	parser.js.push({
		type: 'Script',
		context: 'setup',
		start,
		end,
		content: setupScriptContent,
		// attributes,
		// content: {
		//   start: content_start,
		//   end: content_end,
		//   styles,
		// },
	});
	return;
}
