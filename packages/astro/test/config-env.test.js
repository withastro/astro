import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// NOTE: These tests use two different (but identical) fixtures!
// This ensures that Node's `require` cache doesn't break our tests
describe('config loadEnv', () => {
	it('sets mode to development', async () => {
		const fixture = await loadFixture({ root: './fixtures/config-env-1/' }, { cmd: 'dev' });
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#site').text()).to.match(/development\.my-site\.com/);
	});

	it('sets mode to production', async () => {
		const fixture = await loadFixture({ root: './fixtures/config-env-2/' }, { cmd: 'build' });
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('#site').text()).to.match(/production\.my-site\.com/);
	});
});
