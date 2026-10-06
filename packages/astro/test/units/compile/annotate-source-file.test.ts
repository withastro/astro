import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { compile } from '../../../dist/core/compile/index.js';
import type { AstroConfig } from '../../../dist/types/public/config.js';

async function compileInMode(mode: string) {
	const result = await compile({
		astroConfig: {
			root: pathToFileURL('/'),
			experimental: {},
			devToolbar: { enabled: true },
		} as AstroConfig,
		viteConfig: await resolveConfig({ configFile: false, mode }, 'serve'),
		toolbarEnabled: true,
		filename: '/src/components/Hello.astro',
		source: `<button type="submit" id="go">Go</button>`,
	});
	return result.code;
}

describe('astro/src/core/compile', () => {
	describe('annotateSourceFile', () => {
		it('adds source annotations in dev', async () => {
			const code = await compileInMode('development');
			assert.match(code, /data-astro-source-file=/);
		});

		it('does not add source annotations in Vitest (test mode)', async () => {
			const code = await compileInMode('test');
			assert.doesNotMatch(code, /data-astro-source-file=/);
			assert.doesNotMatch(code, /data-astro-source-loc=/);
		});
	});
});
