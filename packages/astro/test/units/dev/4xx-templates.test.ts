import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../../dist/template/4xx.js';

describe('notFoundTemplate', () => {
	it('produces valid HTML with 404 status code', () => {
		const html = notFoundTemplate('/some-path');
		const $ = cheerio.load(html);
		assert.match($('.statusCode').text(), /404/);
	});

	it('includes the pathname in the output', () => {
		const html = notFoundTemplate('/my/page');
		const $ = cheerio.load(html);
		assert.match($('pre').text(), /\/my\/page/);
	});

	it('uses custom message when provided', () => {
		const html = notFoundTemplate('/test', 'Custom message');
		const $ = cheerio.load(html);
		assert.match($('.statusMessage').text(), /Custom message/);
	});

	it('defaults message to "Not found"', () => {
		const html = notFoundTemplate('/test');
		const $ = cheerio.load(html);
		assert.match($('.statusMessage').text(), /Not found/);
	});

	it('escapes HTML in pathname', () => {
		const html = notFoundTemplate('/<script>alert(1)</script>');
		assert.ok(!html.includes('<script>alert(1)</script>'));
		assert.ok(html.includes('&lt;script&gt;'));
	});

	it('sets correct tab title', () => {
		const html = notFoundTemplate('/test');
		const $ = cheerio.load(html);
		assert.equal($('title').text(), '404: Not found');
	});
});

describe('subpathNotUsedTemplate', () => {
	it('produces valid HTML with 404 status code', () => {
		const html = subpathNotUsedTemplate('/blog', '/');
		const $ = cheerio.load(html);
		assert.match($('.statusCode').text(), /404/);
	});

	it('includes a link to the base path', () => {
		const html = subpathNotUsedTemplate('/blog', '/');
		const $ = cheerio.load(html);
		const link = $('a').first();
		assert.equal(link.attr('href'), '/blog');
		assert.equal(link.text(), '/blog');
	});

	it('includes the base path in the explanation text', () => {
		const html = subpathNotUsedTemplate('/docs/', '/');
		const $ = cheerio.load(html);
		const bodyText = $('body').text();
		assert.ok(bodyText.includes('/docs/'));
	});

	it('sets correct tab title', () => {
		const html = subpathNotUsedTemplate('/blog', '/');
		const $ = cheerio.load(html);
		assert.equal($('title').text(), '404: Not Found');
	});
});
