import { fileURLToPath } from 'url';
import { expect } from 'chai';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { resolveConfig, createSettings } from '../../../dist/core/config/index.js';
import { createFs } from '../test-utils.js';

const root = new URL('../../fixtures/tailwindcss-ts/', import.meta.url);

describe('Astro config formats', () => {
	it('An mjs config can import TypeScript modules', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': ``,
				'/src/stuff.ts': `export default 'works';`,
				'/astro.config.mjs': `
					import stuff from './src/stuff.ts';
					export default {}
				`,
			},
			root
		);

		const { astroConfig } = await resolveConfig({ root: fileURLToPath(root) }, 'dev', fs);
		const settings = createSettings(astroConfig, 'dev');

		await runInContainer({ fs, root, settings }, () => {
			expect(true).to.equal(
				true,
				'We were able to get into the container which means the config loaded.'
			);
		});
	});
});
