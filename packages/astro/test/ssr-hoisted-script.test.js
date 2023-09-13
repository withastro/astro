import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

async function fetchHTML(fixture, path) {
	const app = await fixture.loadTestAdapterApp();
	const request = new Request('http://example.com' + path);
	const response = await app.render(request);
	const html = await response.text();
	return html;
}

describe('Hoisted scripts in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('without base path', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-hoisted-script/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		it('Inlined scripts get included', async () => {
			const html = await fetchHTML(fixture, '/');
			const $ = cheerioLoad(html);
			expect($('script').length).to.equal(1);
		});
	});
});

describe('Hoisted scripts in SSR with base path', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
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
		const html = await fetchHTML(fixture, '/hello/');
		const $ = cheerioLoad(html);
		expect($('script').html()).to.equal('console.log("hello world");\n');
	});
});
