import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { TLSSocket } from 'node:tls';
import * as cheerio from 'cheerio';
import node from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('URL', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/url/',
			output: 'server',
			adapter: node({
				serverEntrypoint: '@astrojs/node/node-handler',
			}),
		});
		await fixture.build();
	});

	it('return http when non-secure', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('http:'), true);
	});

	it('return https when secure', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			socket: new TLSSocket(),
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('https:'), true);
	});

	it('return http when the X-Forwarded-Proto header is set to http', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: { 'X-Forwarded-Proto': 'http' },
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('http:'), true);
	});

	it('return https when the X-Forwarded-Proto header is set to https', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: { 'X-Forwarded-Proto': 'https' },
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		assert.equal(html.includes('https:'), true);
	});

	it('includes forwarded host and port in the url', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': 'abc.xyz',
				'X-Forwarded-Port': '444',
				Host: 'localhost:3000',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		assert.equal($('body').text(), 'https://abc.xyz:444/');
	});

	it('accepts port in forwarded host and forwarded port', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': 'abc.xyz:444',
				'X-Forwarded-Port': '444',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		assert.equal($('body').text(), 'https://abc.xyz:444/');
	});

	it('ignores X-Forwarded-Host when no allowedDomains configured', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': 'malicious.example.com',
				Host: 'legitimate.example.com',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		// Should use the Host header, not X-Forwarded-Host when allowedDomains is not configured
		assert.equal($('body').text(), 'https://legitimate.example.com/');
	});

	it('rejects port in forwarded host when port not in allowedDomains', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': 'abc.xyz:8080',
				Host: 'localhost:3000',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		// Port 8080 not in allowedDomains (only 444), so should fall back to Host header
		assert.equal($('body').text(), 'https://localhost:3000/');
	});

	it('rejects empty X-Forwarded-Host with allowedDomains configured', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': '',
				Host: 'legitimate.example.com',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		// Empty X-Forwarded-Host should be rejected and fall back to Host header
		assert.equal($('body').text(), 'https://legitimate.example.com/');
	});

	it('rejects X-Forwarded-Host with path injection attempt', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule();
		const { req, res, text } = createRequestAndResponse({
			headers: {
				'X-Forwarded-Proto': 'https',
				'X-Forwarded-Host': 'example.com/admin',
				Host: 'localhost:3000',
			},
			url: '/',
		});

		nodeHandler(req, res);
		req.send();

		const html = await text();
		const $ = cheerio.load(html);

		// Path injection attempt should be rejected and fall back to Host header
		assert.equal($('body').text(), 'https://localhost:3000/');
	});
});
