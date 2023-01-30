import { loadFixture, runCLI } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import cloudflare from '../dist/index.js';

describe('mode: "directory"', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
			adapter: cloudflare({ mode: 'directory' }),
		});
	});

	it('Builds', async () => {
		await fixture.build();
	});
});
