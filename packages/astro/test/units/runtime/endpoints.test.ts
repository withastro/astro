import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';
import {
	createBasicSettings,
	createFixture,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

const root = new URL('../../fixtures/api-routes/', import.meta.url);
const fileSystem = {
	'/src/pages/incorrect.ts': `export const GET = _ => {}`,
	'/src/pages/headers.ts': `export const GET = () => { return new Response('content', { status: 201, headers: { Test: 'value' } }) }`,
};

describe('endpoints', () => {
	let container;
	let settings;

	before(async () => {
		const fixture = await createFixture(fileSystem, root);
		settings = await createBasicSettings({
			root: fixture.path,
			output: 'server',
			adapter: testAdapter(),
		});
		container = await createContainer({
			settings,
			logger: defaultLogger,
		});
	});

	after(async () => {
		await container.close();
	});

	it('should respond with 500 for incorrect implementation', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/incorrect',
		});
		container.handle(req, res);
		await done;
		assert.equal(res.statusCode, 500);
	});

	it('should respond with 404 if GET is not implemented', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'HEAD',
			url: '/incorrect-route',
		});
		container.handle(req, res);
		await done;
		assert.equal(res.statusCode, 404);
	});

	it('should respond with same code as GET response', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'HEAD',
			url: '/incorrect',
		});
		container.handle(req, res);
		await done;
		assert.equal(res.statusCode, 500); // get not returns response
	});

	it('should remove body and pass headers for HEAD requests', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'HEAD',
			url: '/headers',
		});
		container.handle(req, res);
		await done;
		assert.equal(res.statusCode, 201);
		assert.equal(res.getHeaders().test, 'value');
		assert.equal(res.body, undefined);
	});
});
