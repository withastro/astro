import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { inferRemoteSize } from 'astro/assets/utils/inferRemoteSize.js';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Image endpoint', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			image: {
				domains: ['images.unsplash.com'],
			},
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('it returns local images', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);

		const img = $('img[alt=Penguins]').attr('src');
		const size = await inferRemoteSize(`http://localhost:4321${img}`);
		assert.equal(size.format, 'webp');
		assert.equal(size.width, 50);
		assert.equal(size.height, 33);
	});

	it('it returns remote images', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		const img = $('img[alt=Cornwall]').attr('src');
		const size = await inferRemoteSize(`http://localhost:4321${img}`);
		assert.equal(size.format, 'webp');
		assert.equal(size.width, 400);
		assert.equal(size.height, 300);
	});

	it('refuses images from unknown domains', async () => {
		const res = await fixture.fetch(
			'/_image?href=https://example.com/image.jpg&w=100&h=100&f=webp&q=75',
		);
		assert.equal(res.status, 403);
	});

	it('refuses common URL bypasses', async () => {
		for (const href of [
			'HTTP://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'HttpS://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'//raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'//raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg?param=https://example.com',
			'/%2fraw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'/%5craw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'/\\raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'///raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'http:\\\\raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'\\\\raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'\\raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'    https://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'\thttps://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'\nhttps://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
			'\rhttps://raw.githubusercontent.com/projectdiscovery/nuclei-templates/refs/heads/main/helpers/payloads/retool-xss.svg',
		]) {
			const res = await fixture.fetch(`/_image?href=${encodeURIComponent(href)}&f=svg`);
			assert.equal(res.status, 403, `Failed on href: ${href}`);
		}
	});
});
