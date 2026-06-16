import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { init, parse } from 'es-module-lexer';
import { resolveConfig } from 'vite';
import type { InlineConfig } from 'vite';
import { compileAstro } from '../dist/plugin/compile.js';
import type { Transform } from '../dist/types.js';
import type { CompileProps } from '../dist/compile/compile.js';

// #region Helpers

async function compile(
	source: string,
	id: string,
	inlineConfig: InlineConfig = {},
	transform?: Transform,
) {
	const viteConfig = await resolveConfig({ configFile: false, ...inlineConfig }, 'serve');
	const props: CompileProps = {
		viteConfig,
		annotateSourceFile: false,
		filename: id,
		source,
	};
	return compileAstro({
		compileProps: props,
		astroFileToCompileMetadata: new Map(),
		transform,
	});
}

// #endregion

// #region Tests

describe('astro full compile', () => {
	it('should compile a single file', async () => {
		const result = await compile(`<h1>Hello World</h1>`, '/src/components/index.astro');
		assert.ok(result.code);
	});

	it('should compile typescript', async () => {
		const result = await compile(
			`\
---
const name: string = 'world'
---

<h1>Hello {name}</h1>`,
			'/src/components/index.astro',
		);
		assert.ok(result.code);
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
				'/src/components/index.astro',
			);
		} catch (e: unknown) {
			assert.equal((e as Error).message.includes('Unterminated string'), true);
		}
		assert.equal(result, undefined);
	});

	it('has file and url exports for markdown compat', async () => {
		const result = await compile(
			`<h1>Hello World</h1>`,
			'/src/components/index.astro',
			undefined,
			(_, code) => code + `\nexport const file = ""; export const url = "";`,
		);
		await init;
		const [, exports] = parse(result.code);
		const names = exports.map((e) => e.n);
		assert.equal(names.includes('default'), true);
		assert.equal(names.includes('file'), true);
		assert.equal(names.includes('url'), true);
	});
});

// #endregion
