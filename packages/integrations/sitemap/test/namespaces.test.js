import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { loadFixture } from './test-utils.js';

describe('Namespaces Configuration', () => {
	let fixture;

	describe('Default namespaces', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [sitemap()],
			});
			await fixture.build();
		});

		it('includes all default namespaces', async () => {
			const xml = await fixture.readFile('/sitemap-0.xml');
			assert.ok(xml.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'));
			assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
			assert.ok(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
			assert.ok(xml.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'));
		});
	});

	describe('Excluding news namespace', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						namespaces: {
							news: false,
						},
					}),
				],
			});
			await fixture.build();
		});

		it('excludes news namespace but includes others', async () => {
			const xml = await fixture.readFile('/sitemap-0.xml');
			assert.ok(!xml.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'));
			assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
			assert.ok(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
			assert.ok(xml.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'));
		});
	});

	describe('Minimal namespaces', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/static/',
				integrations: [
					sitemap({
						namespaces: {
							news: false,
							xhtml: false,
							image: false,
							video: false,
						},
					}),
				],
			});
			await fixture.build();
		});

		it('excludes all optional namespaces', async () => {
			const xml = await fixture.readFile('/sitemap-0.xml');
			assert.ok(!xml.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'));
			assert.ok(!xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
			assert.ok(!xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
			assert.ok(!xml.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'));
			// Still includes the main sitemap namespace
			assert.ok(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
		});
	});
});
