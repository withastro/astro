import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Partials', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/partials/',
		});
	});

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('is only the written HTML', async () => {
			const html = await fixture.fetch('/partials/item/').then((res) => res.text());
			expect(html.startsWith('<li>')).to.equal(true);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('is only the written HTML', async () => {
			const html = await fixture.readFile('/partials/item/index.html');
			expect(html.startsWith('<li>')).to.equal(true);
		});

		it('Works with mdx', async () => {
			const html = await fixture.readFile('/partials/docs/index.html');
			expect(html.startsWith('<h1')).to.equal(true);
		});
	});
});
