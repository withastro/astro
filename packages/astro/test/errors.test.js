import { isWindows, loadFixture } from './test-utils.js';

describe('Error display', () => {
	if (isWindows) return;

	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/errors',
		});
	});

	describe('Astro', () => {
		it('properly detect syntax errors in template', async () => {
			try {
				devServer = await fixture.startDevServer();
			} catch (err) {
				return;
			}
			await devServer.stop();
			throw new Error('Expected to throw on startup');
		});
	});
});
