import traverse from '@babel/traverse';
import generator from '@babel/generator';
import * as t from '@babel/types';
import parser from '@babel/parser';
import prettier from 'prettier';

// @ts-ignore @babel/traverse isn't ESM and needs this trick
export const visit = traverse.default as typeof traverse;

export { t };
export { default as template } from '@babel/template';

export async function generate(ast: t.File, configURL?: string) {
	// @ts-ignore @babel/generator isn't ESM and needs this trick
	const astToText = generator.default as typeof generator;

	const text = astToText(ast, { retainLines: true }).code;

	const prettierOptions = await prettier.resolveConfig(configURL || process.cwd());
	const formatted = prettier.format(text, {
		singleQuote: true,
		semi: true,
		...prettierOptions,
		parser: 'babel-ts',
	});

	return formatted;
}

export const parse = (code: string) => parser.parse(code, { sourceType: 'unambiguous', plugins: ['typescript'] });
