import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Hoisted scripts in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-hoisted-script/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	it('Inlined scripts get included', async () => {
		const html = await fetchHTML('/');
		const $ = cheerioLoad(html);
		expect($('script').length).to.equal(1);
	});

	describe('base path', () => {
		const base = '/hello';

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-hoisted-script/',
				output: 'server',
				adapter: testAdapter(),
				base,
			});
			await fixture.build();
		});

		it('Inlined scripts get included without base path in the script', async () => {
			const html = await fetchHTML('/hello/');
			const $ = cheerioLoad(html);
			expect($('script').html()).to.equal('console.log("hello world");\n');
		});
	});
});
