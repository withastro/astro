// @ts-check
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { Logger } from '../dist/core/logger/core.js';

import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Live content collections', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/live-loaders/',
			adapter: testAdapter(),
		});
	});
	describe('Dev', () => {
		let devServer;
		const logs = [];
		before(async () => {
			devServer = await fixture.startDevServer({
				logger: new Logger({
					level: 'info',
					dest: new Writable({
						objectMode: true,
						write(event, _, callback) {
							logs.push(event);
							callback();
						},
					}),
				}),
			});
		});

		after(async () => {
			devServer?.stop();
		});

		it('can load live data', async () => {
			const res = await fixture.fetch('/api/');
			assert.equal(res.status, 200);
			const data = await res.json();
			assert.deepEqual(data.entryByString, {
				entry: {
					id: '123',
					data: { title: 'Page 123', age: 10 },
					rendered: { html: '<h1>Page 123</h1><p>This is rendered content.</p>' },
					cacheHint: {
						tags: [`page:123`],
						lastModified: '2025-01-01T00:00:00.000Z',
					},
				},
				cacheHint: {
					tags: [`page:123`],
					lastModified: '2025-01-01T00:00:00.000Z',
				},
			});
			assert.deepEqual(data.entryByObject, {
				entry: {
					id: '456',
					data: { title: 'Page 456', age: 20 },
					cacheHint: {
						tags: [`page:456`],
						lastModified: '2025-01-01T00:00:00.000Z',
					},
				},
				cacheHint: {
					tags: [`page:456`],
					lastModified: '2025-01-01T00:00:00.000Z',
				},
			});
			assert.deepEqual(data.collection, {
				entries: [
					{
						id: '123',
						data: { title: 'Page 123', age: 10 },
						rendered: { html: '<h1>Page 123</h1><p>This is rendered content.</p>' },
					},
					{
						id: '456',
						data: { title: 'Page 456', age: 20 },
					},
					{
						id: '789',
						data: { title: 'Page 789', age: 30 },
					},
				],
				cacheHint: {
					tags: ['page'],
					lastModified: '2025-01-02T00:00:00.000Z',
				},
			});
		});

		it('can load live data with dynamic filtering', async () => {
			const res = await fixture.fetch('/api/?addToAge=5');
			assert.equal(res.status, 200);
			const data = await res.json();
			assert.deepEqual(
				data.entryByObject,
				{
					entry: {
						id: '456',
						data: { title: 'Page 456', age: 25 },
						cacheHint: {
							lastModified: '2025-01-01T00:00:00.000Z',
							tags: [`page:456`],
						},
					},
					cacheHint: {
						lastModified: '2025-01-01T00:00:00.000Z',
						tags: [`page:456`],
					},
				},
				'passes dynamic filter to getEntry',
			);
			assert.deepEqual(
				data.collection.entries,
				[
					{
						id: '123',
						data: { title: 'Page 123', age: 15 },
						rendered: { html: '<h1>Page 123</h1><p>This is rendered content.</p>' },
					},
					{
						id: '456',
						data: { title: 'Page 456', age: 25 },
					},
					{
						id: '789',
						data: { title: 'Page 789', age: 35 },
					},
				],
				'passes dynamic filter to getCollection',
			);
		});

		it('returns an error for invalid data', async () => {
			const res = await fixture.fetch('/api/?returnInvalid=true&addToAge=1');
			const data = await res.json();
			assert.ok(
				data.collection.error.message.includes('data does not match the collection schema'),
			);
			assert.equal(data.collection.error.name, 'LiveCollectionValidationError');
		});

		it('old API throws helpful errors for live collections', async () => {
			const response = await fixture.fetch('/test-old-api');
			const data = await response.json();
			assert.ok(data.error.includes('Use getLiveCollection() instead of getCollection()'));
		});

		it('can render live entry with rendered content', async () => {
			const response = await fixture.fetch('/rendered');
			assert.equal(response.status, 200);
			const html = await response.text();
			assert.ok(html.includes('<h1>Page 123</h1>'));
			assert.ok(html.includes('<p>This is rendered content.</p>'));
		});
	});

	describe('SSR', () => {
		let app;

		before(async () => {
			await fixture.build();
			app = await fixture.loadTestAdapterApp();
		});

		it('loads live data', async () => {
			const req = new Request('http://example.com/api/');
			const response = await app.render(req);
			assert.ok(response.ok);
			assert.equal(response.status, 200);
			const data = await response.json();
			assert.deepEqual(data.entryByString, {
				entry: {
					id: '123',
					data: { title: 'Page 123', age: 10 },
					rendered: { html: '<h1>Page 123</h1><p>This is rendered content.</p>' },
					cacheHint: {
						lastModified: '2025-01-01T00:00:00.000Z',
						tags: [`page:123`],
					},
				},
				cacheHint: {
					lastModified: '2025-01-01T00:00:00.000Z',
					tags: [`page:123`],
				},
			});
		});
		it('loads live data with dynamic filtering', async () => {
			const request = new Request('http://example.com/api/?addToAge=5');
			const response = await app.render(request);
			assert.ok(response.ok);
			assert.equal(response.status, 200);
			const data = await response.json();
			assert.deepEqual(
				data.entryByObject,
				{
					entry: {
						id: '456',
						data: { title: 'Page 456', age: 25 },
						cacheHint: {
							lastModified: '2025-01-01T00:00:00.000Z',
							tags: [`page:456`],
						},
					},
					cacheHint: {
						lastModified: '2025-01-01T00:00:00.000Z',
						tags: [`page:456`],
					},
				},
				'passes dynamic filter to getEntry',
			);
		});

		it('old API throws helpful errors for live collections', async () => {
			const request = new Request('http://example.com/test-old-api');
			const response = await app.render(request);
			assert.equal(response.status, 500);
			const data = await response.json();
			assert.ok(data.error.includes('Use getLiveCollection() instead of getCollection()'));
		});

		it('can render live entry with rendered content', async () => {
			const request = new Request('http://example.com/rendered');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			assert.ok(html.includes('<h1>Page 123</h1>'));
			assert.ok(html.includes('<p>This is rendered content.</p>'));
		});
	});
});
