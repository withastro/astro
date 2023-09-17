import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import cloudflare from '../dist/index.js';

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
			let res = await fetch(`http://127.0.0.1:${cli.port}/add/40/2`);
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
			devServer = undefined;
		});

		after(async () => {
			await devServer?.stop();
		});

		it('can serve wasm', async () => {
			devServer = await fixture.startDevServer();
			let res = await fetch(`http://localhost:${devServer.address.port}/add/60/3`);
			expect(res.status).to.equal(200);
			const json = await res.json();
			expect(json).to.deep.equal({ answer: 63 });
		});

		it('fails to build intelligently when wasm is disabled', async () => {
			let ex;
			try {
				await fixture.build({
					adapter: cloudflare({
						wasmModuleImports: false,
					}),
				});
			} catch (err) {
				ex = err;
			}
			expect(ex?.message).to.have.string('add `wasmModuleImports: true` to your astro config');
		});

		it('can import wasm in both SSR and SSG pages', async () => {
			await fixture.build({ output: 'hybrid' });
			const staticContents = await fixture.readFile('./hybrid');
			expect(staticContents).to.be.equal('{"answer":21}');
			const assets = await fixture.readdir('./_astro');
			expect(assets.map((x) => x.slice(x.lastIndexOf('.')))).to.contain('.wasm');
		});
	});
});
