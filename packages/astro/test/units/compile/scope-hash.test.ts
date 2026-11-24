import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compileAstro } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-astro/compile.js';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import type { CompileProps } from '@astrojs/vite-plugin-astro/_internal/core/compile/compile.js';

const source = `<p class="box">Hi</p><style>.box { color: red; }</style>`;

/** Compile `source` as `filename` within `root` and return the scope id used by the HTML and CSS. */
async function compileScope(root: string, filename: string) {
	const viteConfig = await resolveConfig({ configFile: false }, 'serve');
	const props: CompileProps = {
		astroConfig: {
			root: pathToFileURL(root + path.sep),
			base: '/',
			experimental: {},
			build: { format: 'directory' },
			trailingSlash: 'ignore',
		} as AstroConfig,
		viteConfig,
		toolbarEnabled: false,
		filename: filename.replaceAll(path.sep, '/'),
		source,
	};
	const result = await compileAstro({
		compileProps: props as any,
		astroFileToCompileMetadata: new Map(),
	});
	return {
		html: result.code.match(/astro-[a-z0-9]{8}/)?.[0],
		css: result.css[0].code.match(/astro-[a-z0-9]{8}/)?.[0],
	};
}

describe('Scoped style hash', () => {
	it('is the same when the root casing differs from the file path casing', async () => {
		const root = path.resolve('/tmp/my-site');
		const filename = path.join(root, 'src/components/Box.astro');

		const matching = await compileScope(root, filename);
		const mismatched = await compileScope(path.resolve('/TMP/my-site'), filename);

		assert.ok(matching.html);
		assert.equal(matching.css, matching.html);
		assert.equal(mismatched.html, matching.html);
		assert.equal(mismatched.css, matching.html);
	});
});
