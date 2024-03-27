import { expect } from 'chai';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db local database', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/local-prod/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
	});

	describe('build (not remote) with DATABASE_FILE env', () => {
		const prodDbPath = new URL('./fixtures/basics/dist/astro.db', import.meta.url).toString();
		before(async () => {
			process.env.ASTRO_DATABASE_FILE = prodDbPath;
			await fixture.build();
		});

		after(async () => {
			delete process.env.ASTRO_DATABASE_FILE;
		});

		it('Can render page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			expect(response.status).to.equal(200);
		});
	});

	describe('build (not remote)', () => {
		it('should throw during the build for server output', async () => {
			delete process.env.ASTRO_DATABASE_FILE;
			let buildError = null;
			try {
				await fixture.build();
			} catch (err) {
				buildError = err;
			}

			expect(buildError).to.be.an('Error');
		});

		it('should throw during the build for hybrid output', async () => {
			let fixture2 = await loadFixture({
				root: new URL('./fixtures/local-prod/', import.meta.url),
				output: 'hybrid',
				adapter: testAdapter(),
			});

			delete process.env.ASTRO_DATABASE_FILE;
			let buildError = null;
			try {
				await fixture2.build();
			} catch (err) {
				buildError = err;
			}

			expect(buildError).to.be.an('Error');
		});
	});
});
