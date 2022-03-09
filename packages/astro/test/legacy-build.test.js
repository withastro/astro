import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Legacy Build', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/legacy-build/',
		});
		await fixture.build({buildOptions: {legacyBuild: true}});
	});

	describe('build', () => {
		it('is successful', async () => {
			const html = await fixture.readFile(`/index.html`);
			const $ = cheerio.load(html);
			expect($('title').text()).to.equal('Demo app');
		});

	});
});
