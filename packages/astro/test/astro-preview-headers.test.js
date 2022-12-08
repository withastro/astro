import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Astro preview headers', () => {
	let fixture;
	let previewServer;
	const headers = {
		astro: 'test',
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-preview-headers/',
			server: {
				headers,
			},
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	// important: close preview server (free up port and connection)
	after(async () => {
		await previewServer.stop();
	});

	describe('preview', () => {
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
