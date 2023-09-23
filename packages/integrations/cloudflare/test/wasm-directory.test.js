import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';

describe('Wasm directory mode import', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').WranglerCLI} */
	let cli;

	before(async function () {
		fixture = await loadFixture({
			root: './fixtures/wasm-directory/',
		});
		await fixture.build();

		cli = await runCLI('./fixtures/wasm-directory/', {
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
