import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Errors', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/errors/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});
	let devPreview;

	before(async () => {
		devPreview = await fixture.preview();
	});
	after(async () => {
		await devPreview.stop();
	});

	it('rejected promise in template', async () => {
		const res = await fixture.fetch('/in-stream');
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal($('p').text().trim(), 'Internal server error');
	});

	it('generator that throws called in template', async () => {
		/** @type {Response} */
		const res = await fixture.fetch('/generator');
		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		const expect = async ({ done, value }) => {
			const result = await reader.read();
			assert.equal(result.done, done);
			if (!done) assert.equal(decoder.decode(result.value), value);
		};
		await expect({ done: false, value: '<!DOCTYPE html><h1>Astro</h1> 1Internal server error' });
		await expect({ done: true });
	});
});
