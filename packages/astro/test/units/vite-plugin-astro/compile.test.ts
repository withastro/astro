import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { init, parse } from 'es-module-lexer';
import { resolveConfig } from 'vite';
import type { InlineConfig } from 'vite';
import { compileAstro } from '../../../dist/vite-plugin-astro/compile.js';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import type { CompileProps } from '../../../dist/core/compile/compile.js';

// #region Helpers

/** Minimal AstroConfig stub for compile tests. */
function makeAstroConfig(overrides: Partial<AstroConfig> = {}): AstroConfig {
	return {
		root: pathToFileURL('/'),
		base: '/',
		experimental: {},
		...overrides,
	} as AstroConfig;
}

async function compile(source: string, id: string, inlineConfig: InlineConfig = {}) {
	const viteConfig = await resolveConfig({ configFile: false, ...inlineConfig }, 'serve');
	// compileAstro's CompileAstroOption traces back to src/AstroConfig via rewriteRelativeImportExtensions,
	// but we import from dist/. The types are structurally identical at runtime; cast to bridge the gap.
	const props: CompileProps = {
		astroConfig: makeAstroConfig(),
		viteConfig,
		toolbarEnabled: false,
		filename: id,
		source,
	};
	return (
		compileAstro as (opts: {
			compileProps: CompileProps;
			astroFileToCompileMetadata: Map<unknown, unknown>;
		}) => ReturnType<typeof compileAstro>
	)({
		compileProps: props,
		astroFileToCompileMetadata: new Map(),
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
			assert.equal((e as Error).message.includes('Unterminated string literal'), true);
		}
		assert.equal(result, undefined);
	});

	it('has file and url exports for markdown compat', async () => {
		const result = await compile(`<h1>Hello World</h1>`, '/src/components/index.astro');
		await init;
		const [, exports] = parse(result.code);
		const names = exports.map((e) => e.n);
		assert.equal(names.includes('default'), true);
		assert.equal(names.includes('file'), true);
		assert.equal(names.includes('url'), true);
	});

	describe('when the code contains syntax that is transformed by esbuild', () => {
		const code = `\
---
using x = {}
---`;

		it('should not transform the syntax by default', async () => {
			const result = await compile(code, '/src/components/index.astro');
			assert.equal(result.code.includes('using x = {}'), true);
		});

		it('should transform the syntax by esbuild.target', async () => {
			const result = await compile(code, '/src/components/index.astro', {
				esbuild: { target: 'es2018' },
			});
			assert.equal(result.code.includes('using x = {}'), false);
		});
	});
});

// #endregion
