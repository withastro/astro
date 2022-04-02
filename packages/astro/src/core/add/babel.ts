import traverse from '@babel/traverse';
import generator from '@babel/generator';
import * as t from '@babel/types';
import parser from '@babel/parser';

// @ts-ignore @babel/traverse isn't ESM and needs this trick
export const visit = traverse.default as typeof traverse;
export { t };

export async function generate(ast: t.File) {
	// @ts-ignore @babel/generator isn't ESM and needs this trick
	const astToText = generator.default as typeof generator;
	const { code } = astToText(ast);
	return code;
}

export const parse = (code: string) =>
	parser.parse(code, { sourceType: 'unambiguous', plugins: ['typescript'] });
