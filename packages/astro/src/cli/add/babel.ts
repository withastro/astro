import generator from '@babel/generator';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const visit = traverse.default;
export { t };

export async function generate(ast: t.File) {
	const astToText = generator.default;
	const { code } = astToText(ast);
	return code;
}

export const parse = (code: string) =>
	parser.parse(code, { sourceType: 'unambiguous', plugins: ['typescript'] });
