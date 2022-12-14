import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Astro dev headers', () => {
	let fixture;
	let devServer;
	const headers = {
		'x-astro': 'test',
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-headers/',
			server: {
				headers,
			},
		});
		await fixture.build();
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('dev', () => {
		it('returns custom headers for valid URLs', async () => {
			const result = await fixture.fetch('/');
			expect(result.status).to.equal(200);
			expect(Object.fromEntries(result.headers)).to.include(headers);
		});

		it('does not return custom headers for invalid URLs', async () => {
			const result = await fixture.fetch('/bad-url');
			expect(result.status).to.equal(404);
			expect(Object.fromEntries(result.headers)).not.to.include(headers);
		});
	});
});
