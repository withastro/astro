import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { getCloudflareCompatibilityDate } from '../../../dist/cli/add/cloudflare.js';

describe('astro add cloudflare', () => {
	it('uses the compatibility date exported by the installed adapter', async () => {
		const projectDir = await mkdtemp(join(tmpdir(), 'astro-add-cloudflare-'));
		const adapterDir = join(projectDir, 'node_modules', '@astrojs', 'cloudflare');

		try {
			await mkdir(adapterDir, { recursive: true });
			await writeFile(
				join(adapterDir, 'package.json'),
				JSON.stringify({
					name: '@astrojs/cloudflare',
					type: 'module',
					exports: { './info': './info.js' },
				}),
			);
			await writeFile(
				join(adapterDir, 'info.js'),
				`export function getLocalWorkerdCompatibilityDate() {
	return { date: '2026-08-15', source: 'workerd' };
}
`,
			);

			const date = await getCloudflareCompatibilityDate(pathToFileURL(`${projectDir}/`));

			assert.equal(date, '2026-08-15');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
