import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('LLM Optimization', () => {
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/llm-optimization/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('returns HTML by default', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/html/);

		const html = await res.text();
		assert.match(html, /Welcome to the LLM Test/);
	});

	it('returns markdown when Accept: text/markdown header is set', async () => {
		const res = await fixture.fetch('/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/markdown/);

		const content = await res.text();
		// Check for markdown headings
		assert.match(content, /# Welcome to the LLM Test/);
		// Check for markdown paragraph
		assert.match(content, /This is a test page for LLM optimization\./);
	});

	it('strips nav and footer elements in markdown conversion', async () => {
		const res = await fixture.fetch('/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		assert.equal(res.status, 200);

		const markdown = await res.text();
		// Nav and footer should be removed by turndown
		assert.doesNotMatch(markdown, /Home/);
		assert.doesNotMatch(markdown, /Footer content/);
	});

	it('does not convert to markdown without Accept header', async () => {
		const res = await fixture.fetch('/', {
			headers: {
				'Accept': 'text/html',
			},
		});
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/html/);

		const html = await res.text();
		assert.match(html, /Welcome to the LLM Test/);
	});
});

describe('LLM Optimization build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/llm-optimization/',
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('returns HTML by default in production', async () => {
		const request = new Request('http://example.com/');
		const res = await app.render(request);
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/html/);

		const html = await res.text();
		assert.match(html, /Welcome to the LLM Test/);
	});

	it('returns markdown when Accept: text/markdown header is set in production', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		const res = await app.render(request);
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/markdown/);

		const content = await res.text();
		// Check for markdown headings
		assert.match(content, /# Welcome to the LLM Test/);
		// Check for markdown paragraph
		assert.match(content, /This is a test page for LLM optimization\./);
	});

	it('strips nav and footer elements in markdown conversion in production', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		const res = await app.render(request);
		assert.equal(res.status, 200);

		const markdown = await res.text();
		// Nav and footer should be removed by turndown
		assert.doesNotMatch(markdown, /Home/);
		assert.doesNotMatch(markdown, /Footer content/);
	});

	it('does not convert to markdown without Accept header in production', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/html',
			},
		});
		const res = await app.render(request);
		assert.equal(res.status, 200);
		assert.match(res.headers.get('content-type'), /text\/html/);

		const html = await res.text();
		assert.match(html, /Welcome to the LLM Test/);
	});
});
