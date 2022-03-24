import { isWindows, loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Error display', () => {
	if (isWindows) return;

	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/errors',
		});
	});

	describe('Astro', async () => {
		// This test is skipped because it will hang on vite@2.8.x
		// TODO: unskip test once vite@2.9.x lands
		// See pre-integration system test: https://github.com/withastro/astro/blob/0f376a7c52d3a22ff32b33e0afc34dd306ed70c4/packages/astro/test/errors.test.js
		it.skip('properly detect syntax errors in template', async () => {
				try {
					devServer = await fixture.startDevServer();
				} catch (err) {
					return;
				}

				// This is new behavior in vite@2.9.x, previously the server would throw on startup
				const res = await fixture.fetch('/astro-syntax-error');
				await devServer.stop();
				expect(res.status).to.equal(500, `Successfully responded with 500 Error for invalid file`);
			});
	});
});
