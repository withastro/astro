import { Node } from 'acorn';
import acorn from 'acorn';
// @ts-ignore
import jsx from 'acorn-jsx';

const acornJsx = acorn.Parser.extend(jsx());

export const parse = (source: string): Node => acorn.parse(source, {
	sourceType: 'module',
	ecmaVersion: 2020,
	locations: true
});

export const parse_expression_at = (source: string, index: number): Node => acornJsx.parseExpressionAt(source, index, {
	sourceType: 'module',
	ecmaVersion: 2020,
	locations: true
});
