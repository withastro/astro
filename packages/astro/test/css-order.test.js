import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('CSS production ordering', () => {
	let staticHTML, serverHTML;
	let staticCSS, serverCSS;

	const commonConfig = Object.freeze({
		root: './fixtures/css-order/',
	});

	function getLinks(html) {
		let $ = cheerio.load(html);
		let out = [];
		$('link[rel=stylesheet]').each((i, el) => {
			out.push($(el).attr('href'))
		});
		return out;
	}

	before(async () => {
		let fixture = await loadFixture({ ...commonConfig });
		await fixture.build();
		staticHTML = await fixture.readFile('/one/index.html');
		staticCSS = await Promise.all(getLinks(staticHTML).map(async (href) => {
			const css = await fixture.readFile(href);
			return { href, css };
		}));
	});

	before(async () => {
		let fixture = await loadFixture({
			...commonConfig,
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();

		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/one');
		const response = await app.render(request);
		serverHTML = await response.text();
		serverCSS = await Promise.all(getLinks(serverHTML).map(async (href) => {
			const css = await fixture.readFile(`/client${href}`);
			return { href, css };
		}));
	});

	it('is in the same order for output: server and static', async () => {
		const staticContent = staticCSS.map(o => o.css);
		const serverContent = serverCSS.map(o => o.css);

		expect(staticContent).to.deep.equal(serverContent);
	});
});
