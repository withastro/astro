import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Svelte component', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/svelte-component/',
			outDir: './dist/svelte-component/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Works with TypeScript', async () => {
			const html = await fixture.readFile('/typescript/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#svelte-ts').text(), 'Hello, TypeScript');
		});

		it('Works with custom Svelte config', async () => {
			const html = await fixture.readFile('/typescript/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#svelte-custom-ext').text(), 'Hello, Custom Extensions');
		});
	});
});
