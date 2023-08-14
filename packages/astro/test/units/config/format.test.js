import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { createFs, runInContainer } from '../test-utils.js';

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

		await runInContainer({ fs, inlineConfig: { root: fileURLToPath(root) } }, () => {
			expect(true).to.equal(
				true,
				'We were able to get into the container which means the config loaded.'
			);
		});
	});
});
