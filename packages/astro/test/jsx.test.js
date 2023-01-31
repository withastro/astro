import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('jsx-runtime', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/jsx/',
		});
		await fixture.build();
	});

	it('Can load simple JSX components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('#basic').text()).to.equal('Basic');
		expect($('#named').text()).to.equal('Named');
	});

	it('Can load Preact component inside Astro JSX', async () => {
		const html = await fixture.readFile('/frameworks/index.html');
		const $ = cheerio.load(html);

		expect($('#has-preact #preact').length).to.equal(1);
		expect($('#preact').text()).to.include('Preact');
	});

	it('Can load React component inside Astro JSX', async () => {
		const html = await fixture.readFile('/frameworks/index.html');
		const $ = cheerio.load(html);

		expect($('#has-react #react').length).to.equal(1);
		expect($('#react').text()).to.include('React');
	});

	it('Can load Solid component inside Astro JSX', async () => {
		const html = await fixture.readFile('/frameworks/index.html');
		const $ = cheerio.load(html);

		expect($('#has-solid #solid').length).to.equal(1);
		expect($('#solid').text()).to.include('Solid');
	});

	it('Can load Svelte component inside Astro JSX', async () => {
		const html = await fixture.readFile('/frameworks/index.html');
		const $ = cheerio.load(html);

		expect($('#has-svelte #svelte').length).to.equal(1);
		expect($('#svelte').text()).to.include('Svelte');
	});

	it('Can load Vue component inside Astro JSX', async () => {
		const html = await fixture.readFile('/frameworks/index.html');
		const $ = cheerio.load(html);

		expect($('#has-vue #vue').length).to.equal(1);
		expect($('#vue').text()).to.include('Vue');
	});
});
