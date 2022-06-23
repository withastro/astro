import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots: Svelte', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/slots-svelte/' });
		await fixture.build();
	});

	it('Renders default slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		expect($('#default-self-closing').text().trim()).to.equal('Fallback');
		expect($('#default-empty').text().trim()).to.equal('Fallback');
		expect($('#zero').text().trim()).to.equal('0');
		expect($('#false').text().trim()).to.equal('');
		expect($('#string').text().trim()).to.equal('');
		expect($('#content').text().trim()).to.equal('Hello world!');
	});

	it('Renders named slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#named').text().trim()).to.equal('Fallback / Named');
	})

	it('Preserves dash-case slot', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#dash-case').text().trim()).to.equal('Fallback / Dash Case');
	})

	describe('For Markdown Pages', () => {
		it('Renders default slot', async () => {
			const html = await fixture.readFile('/markdown/index.html');
			const $ = cheerio.load(html);
			expect($('#content').text().trim()).to.equal('Hello world!');
		});

		it('Renders named slot', async () => {
			const html = await fixture.readFile('/markdown/index.html');
			const $ = cheerio.load(html);
			expect($('#named').text().trim()).to.equal('Fallback / Named');
		})

		it('Converts dash-case slot to camelCase', async () => {
			const html = await fixture.readFile('/markdown/index.html');
			const $ = cheerio.load(html);
			expect($('#dash-case').text().trim()).to.equal('Fallback / Dash Case');
		})
	})
});
