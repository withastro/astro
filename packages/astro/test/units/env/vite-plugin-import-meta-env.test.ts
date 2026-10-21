import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import type { ResolvedConfig } from 'vite';
import { importMetaEnv } from '../../../dist/env/vite-plugin-import-meta-env.js';
import { createFixture } from '../test-utils.ts';

describe('astro:vite-plugin-env', () => {
	let fixture: Awaited<ReturnType<typeof createFixture>>;

	before(async () => {
		fixture = await createFixture({
			'tsconfig.json': JSON.stringify({ extends: 'unresolvable-package/tsconfig.json' }),
			'src/pages/index.astro': '',
		});
	});

	after(async () => {
		await fixture.rm();
	});

	it('replaces import.meta.env in build without loading tsconfig files', async () => {
		const plugin: any = importMetaEnv({
			envLoader: { getPrivateEnv: () => ({ SECRET: '"secret"' }) } as any,
		});
		plugin.config({}, { command: 'build' });
		plugin.configResolved({
			command: 'build',
			build: { sourcemap: false },
			plugins: [],
			assetsInclude: () => false,
		} as unknown as ResolvedConfig);

		const id = path.join(fixture.path, 'src/pages/index.astro');
		const result = await plugin.transform.handler.call(
			{ environment: { name: 'ssr' } },
			'const env = import.meta.env;\nconst secret = import.meta.env.SECRET;\n',
			id,
		);

		assert.match(result.code, /Object\.assign\(import\.meta\.env/);
		assert.match(result.code, /const secret = "secret"/);
	});
});
