import generator from '@babel/generator';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import type * as Babel from '@babel/types';

const t = await import('@babel/types')
		.catch(error => new Proxy({}, { get: () => {
			if (process.version === 'v20.6.0') {
				console.error("The build could not complete because of a bug in Node.js v20.6.0.\nSee https://github.com/nodejs/node/issues/49497\n\nConsider using Node.js v20.5.1, or update if the issue has been fixed.")
			}
			else { console.log(error) }
			process.exit(1)
		} }) as never);

// @ts-expect-error @babel/traverse isn't ESM and needs this trick
export const visit = traverse.default as typeof traverse;
export { t };

export async function generate(ast: Babel.File) {
	// @ts-expect-error @babel/generator isn't ESM and needs this trick
	const astToText = generator.default as typeof generator;
	const { code } = astToText(ast);
	return code;
}

export const parse = (code: string) =>
	parser.parse(code, { sourceType: 'unambiguous', plugins: ['typescript'] });
