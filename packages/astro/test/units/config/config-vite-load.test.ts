import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadConfigWithVite } from '../../../dist/core/config/vite-load.js';
import { createFixture } from '../test-utils.ts';
import fs from 'node:fs';

describe('loadConfigWithVite', () => {
	it('resolves tsconfig path aliases in astro.config.ts', async () => {
		const fixture = await createFixture({
			'tsconfig.json': JSON.stringify({
				compilerOptions: {
					baseUrl: '.',
					paths: {
						'@config/*': ['src/config/*'],
					},
				},
			}),
			'src/config/site.ts': 'export const SITE_TITLE = "Test Site";',
			'astro.config.ts': `
				import { SITE_TITLE } from '@config/site';
				export default { site: 'https://example.com', compressHTML: SITE_TITLE === "Test Site" };
			`,
		});

		try {
			const config = await loadConfigWithVite({
				root: fixture.path,
				configPath: fixture.getPath('astro.config.ts'),
				fs,
			});

			assert.equal(config.site, 'https://example.com');
			assert.equal(config.compressHTML, true);
		} finally {
			await fixture.rm();
		}
	});
});
