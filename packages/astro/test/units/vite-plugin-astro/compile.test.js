import { expect } from 'chai';
import { resolveConfig } from 'vite';
import { cachedFullCompilation } from '../../../dist/vite-plugin-astro/compile.js';
import { init, parse } from 'es-module-lexer';
import { pathToFileURL } from 'node:url';

const viteConfig = await resolveConfig({ configFile: false }, 'serve');

/**
 * @param {string} source
 * @param {string} id
 */
async function compile(source, id) {
	return await cachedFullCompilation({
		compileProps: {
			astroConfig: { root: pathToFileURL('/'), base: '/' },
			viteConfig,
			filename: id,
			source,
		},
		logging: {
			level: 'info',
		},
		rawId: id,
	});
}

describe('astro full compile', () => {
	it('should compile a single file', async () => {
		const result = await compile(`<h1>Hello World</h1>`, '/src/components/index.astro');
		expect(result.code).to.be.ok;
	});

	it('should compile typescript', async () => {
		const result = await compile(
			`\
---
const name: string = 'world'
---

<h1>Hello {name}</h1>`,
			'/src/components/index.astro'
		);
		expect(result.code).to.be.ok;
	});

	it('should error on invalid js', async () => {
		let result;
		try {
			result = await compile(
				`\
---
const name = 'world
---

<h1>Hello {name}</h1>`,
				'/src/components/index.astro'
			);
		} catch (e) {
			expect(e.message).to.include('Unterminated string literal');
		}
		expect(result).to.be.undefined;
	});

	it('injects hmr code', async () => {
		const result = await compile(`<h1>Hello World</h1>`, '/src/components/index.astro');
		expect(result.code).to.include('import.meta.hot');
	});

	it('has file and url exports for markdwon compat', async () => {
		const result = await compile(`<h1>Hello World</h1>`, '/src/components/index.astro');
		await init;
		const [, exports] = parse(result.code);
		const names = exports.map((e) => e.n);
		expect(names).to.include('default');
		expect(names).to.include('file');
		expect(names).to.include('url');
	});
});
