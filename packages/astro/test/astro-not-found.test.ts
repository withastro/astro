import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('notFound() and NotFoundError', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-not-found/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('calling notFound() in an .astro component frontmatter renders 404.astro with HTTP status 404', async () => {
		const logs: unknown[][] = [];
		const originalError = app.logger.error;
		app.logger.error = (...args: Parameters<typeof originalError>) => {
			logs.push(args);
			return originalError.apply(app.logger, args);
		};

		try {
			const request = new Request('http://example.com/page-not-found');
			const response = await app.render(request);

			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404 Page');
			assert.equal(logs.length, 0, 'Should not log server error for notFound()');
		} finally {
			app.logger.error = originalError;
		}
	});

	it('calling notFound("Item not found", "Custom Title") passes the error object into Astro.props.error', async () => {
		const request = new Request('http://example.com/page-not-found-custom');
		const response = await app.render(request);

		assert.equal(response.status, 404);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Custom 404 Page');
		assert.equal($('#error-message').text(), 'Item not found');
		assert.equal($('#error-title').text(), 'Custom Title');
	});

	it('calling notFound() in an API route endpoint returns a 404 response', async () => {
		const logs: unknown[][] = [];
		const originalError = app.logger.error;
		app.logger.error = (...args: Parameters<typeof originalError>) => {
			logs.push(args);
			return originalError.apply(app.logger, args);
		};

		try {
			const request = new Request('http://example.com/api/item');
			const response = await app.render(request);

			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404 Page');
			assert.equal($('#error-message').text(), 'API item not found');
			assert.equal($('#error-title').text(), 'API Error');
			assert.equal(logs.length, 0, 'Should not log server error for notFound() in endpoint');
		} finally {
			app.logger.error = originalError;
		}
	});

	it('calling notFound() in middleware renders the 404 page', async () => {
		const logs: unknown[][] = [];
		const originalError = app.logger.error;
		app.logger.error = (...args: Parameters<typeof originalError>) => {
			logs.push(args);
			return originalError.apply(app.logger, args);
		};

		try {
			const request = new Request('http://example.com/middleware-not-found');
			const response = await app.render(request);

			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404 Page');
			assert.equal($('#error-message').text(), 'Middleware item not found');
			assert.equal($('#error-title').text(), 'Middleware Title');
			assert.equal(logs.length, 0, 'Should not log server error for notFound() in middleware');
		} finally {
			app.logger.error = originalError;
		}
	});

	it('normal uncaught exceptions continue to render 500.astro with HTTP status 500 and output the server stack trace', async () => {
		const logs: unknown[][] = [];
		const originalError = app.logger.error;
		app.logger.error = (...args: Parameters<typeof originalError>) => {
			logs.push(args);
			return originalError.apply(app.logger, args);
		};

		try {
			const request = new Request('http://example.com/uncaught-error');
			const response = await app.render(request);

			assert.equal(response.status, 500);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 500 Page');
			assert.equal($('#error-message').text(), 'Server crash failure');
			assert.ok(logs.length > 0, 'Should log server error for uncaught 500 error');
			assert.ok(
				logs.some((l) => JSON.stringify(l).includes('Server crash failure')),
				'Log should contain the error message and stack trace',
			);
		} finally {
			app.logger.error = originalError;
		}
	});

	describe('dev mode', () => {
		let devFixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			devFixture = await loadFixture({
				root: './fixtures/astro-not-found/',
			});
			devServer = await devFixture.startDevServer();
		});

		after(async () => {
			await devServer?.stop();
		});

		it('renders 404.astro with status 404 in dev mode', async () => {
			const res = await devFixture.fetch('/page-not-found-custom');
			assert.equal(res.status, 404);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom 404 Page');
			assert.equal($('#error-message').text(), 'Item not found');
			assert.equal($('#error-title').text(), 'Custom Title');
		});

		it('endpoint returns 404 in dev mode', async () => {
			const res = await devFixture.fetch('/api/item');
			assert.equal(res.status, 404);
		});
	});
});
