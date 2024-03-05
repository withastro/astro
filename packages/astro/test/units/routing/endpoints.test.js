import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';
import {
	createBasicSettings,
	createFs,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

const root = new URL('../../fixtures/api-routes/', import.meta.url);
const fileSystem = {
	'/src/pages/response-redirect.ts': `export const GET = ({ url }) => Response.redirect("https://example.com/destination", 307)`,
	'/src/pages/response.ts': `export const GET = ({ url }) => new Response(null, { headers: { Location: "https://example.com/destination" }, status: 307 })`,
	'/src/pages/not-found.ts': `export const GET = ({ url }) => new Response('empty', { headers: { "Content-Type": "text/plain" }, status: 404 })`,
	'/src/pages/internal-error.ts': `export const GET = ({ url }) => new Response('something went wrong', { headers: { "Content-Type": "text/plain" }, status: 500 })`,
};

describe('endpoints', () => {
	let container;
	let settings;

	before(async () => {
		const fs = createFs(fileSystem, root);
		settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			adapter: testAdapter(),
		});
		container = await createContainer({
			fs,
			settings,
			logger: defaultLogger,
		});
	});

	after(async () => {
		await container.close();
	});

	it('should return a redirect response with location header', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/response-redirect',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.equal(headers['location'], 'https://example.com/destination');
		assert.equal(headers['x-astro-reroute'], undefined);
		assert.equal(res.statusCode, 307);
	});

	it('should return a response with location header', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/response',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.equal(headers['location'], 'https://example.com/destination');
		assert.equal(res.statusCode, 307);
	});

	it('should remove internally-used for HTTP status 404', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/not-found',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.equal(headers['x-astro-reroute'], undefined);
		assert.equal(res.statusCode, 404);
	});

	it('should remove internally-used header for HTTP status 500', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/internal-error',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.equal(headers['x-astro-reroute'], undefined);
		assert.equal(res.statusCode, 500);
	});
});
