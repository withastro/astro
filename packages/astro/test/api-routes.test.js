import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as fs from 'fs';

import { FormData, File } from 'node-fetch'

describe('API routes', () => {
	describe('Development - SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				output: 'server',
				root: './fixtures/api-routes/'
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can be passed binary data from multipart formdata', async () => {
			const formData  = new FormData();
			const raw = await fs.promises.readFile(new URL('./fixtures/api-routes/src/images/penguin.jpg', import.meta.url));
			const file = new File([raw], 'penguin.jpg', { type: 'text/jpg' });
			formData.set('file', file, 'penguin.jpg');

			const res = await fixture.fetch('/binary', {
				method: 'POST',
				body: formData
			});

			expect(res.status).to.equal(200);
		});
	});

	describe('Build - SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/api-routes/' });
			await fixture.build();
		});
	
		describe('Deprecated API', () => {
			it('two argument supported', async () => {
				const one = JSON.parse(await fixture.readFile('/old-api/twoarg/one.json'));
				expect(one).to.deep.equal({
					param: 'one',
					pathname: '/old-api/twoarg/one.json',
				});
				const two = JSON.parse(await fixture.readFile('/old-api/twoarg/two.json'));
				expect(two).to.deep.equal({
					param: 'two',
					pathname: '/old-api/twoarg/two.json',
				});
			});
	
			it('param first argument is supported', async () => {
				const one = JSON.parse(await fixture.readFile('/old-api/onearg/one.json'));
				expect(one).to.deep.equal({
					param: 'one',
				});
			});
		});
	
		describe('1.0 API', () => {
			it('Receives a context argument', async () => {
				const one = JSON.parse(await fixture.readFile('/context/data/one.json'));
				expect(one).to.deep.equal({
					param: 'one',
					pathname: '/context/data/one.json',
				});
			});
		});
	})
});
