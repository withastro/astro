import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';

describe('Wasm import', () => {
	describe('in cloudflare workerd', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;
		/** @type {import('./test-utils.js').WranglerCLI} */
		let cli;

		before(async function () {
			fixture = await loadFixture({
				root: './fixtures/wasm/',
			});
			await fixture.build();

			cli = await runCLI('./fixtures/wasm/', {
				silent: true,
				onTimeout: (ex) => {
					console.log(ex);
					// if fail to start, skip for now as it's very flaky
					this.skip();
				},
			});
		});

		after(async () => {
			await cli?.stop();
		});

		it('can render', async () => {
			let res = await fetch(`http://127.0.0.1:${cli.port}/`);
			expect(res.status).to.equal(200);
			const json = await res.json();
			expect(json).to.deep.equal({ answer: 42 });
		});
	});
	describe('astro dev server', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/wasm/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer?.stop();
		});

		it('can serve wasm', async () => {
			let res = await fetch(`http://localhost:${devServer.address.port}/`);
			expect(res.status).to.equal(200);
			const json = await res.json();
			expect(json).to.deep.equal({ answer: 42 });
		});
	});
});
