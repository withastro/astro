import { Parser } from '../index.js';
import { Node } from 'estree';
import { Style } from '../../interfaces.js';

export default function read_style(parser: Parser, start: number, attributes: Node[]): Style {
	const content_start = parser.index;
	const styles = parser.read_until(/<\/style>/);
	const content_end = parser.index;
	parser.eat('</style>', true);
	const end = parser.index;

	return {
		type: 'Style',
		start,
		end,
		attributes,
		content: {
			start: content_start,
			end: content_end,
			styles
		}
	};
}

function is_ref_selector(a: any, b: any) { // TODO add CSS node types
	if (!b) return false;

	return (
		a.type === 'TypeSelector' &&
		a.name === 'ref' &&
		b.type === 'PseudoClassSelector'
	);
}
