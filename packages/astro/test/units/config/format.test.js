import { expect } from 'chai';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { openConfig, createSettings } from '../../../dist/core/config/index.js';
import { createFs, defaultLogging } from '../test-utils.js';

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

		const { astroConfig } = await openConfig({
			cwd: root,
			flags: {},
			cmd: 'dev',
			logging: defaultLogging,
			fsMod: fs,
		});
		const settings = createSettings(astroConfig);

		await runInContainer({ fs, root, settings }, () => {
			expect(true).to.equal(
				true,
				'We were able to get into the container which means the config loaded.'
			);
		});
	});
});
