import {
	createBasicSettings,
	createFs,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';

const root = new URL('../../fixtures/api-routes/', import.meta.url);
const fileSystem = {
	'/src/pages/api.ts': `export const GET = () => Response.json({ success: true })`,
};

describe('trailingSlash', () => {
	let container;
	let settings;

	before(async () => {
		const fs = createFs(fileSystem, root);
		settings = await createBasicSettings({
			root: fileURLToPath(root),
			trailingSlash: 'always',
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

	it('should match the API route when request has a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api/',
		});
		container.handle(req, res);
		const json = await text();
		expect(json).to.equal('{"success":true}');
	});

	it('should NOT match the API route when request lacks a trailing slash', async () => {
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api',
		});
		container.handle(req, res);
		expect(await text()).to.equal('');
		expect(res.statusCode).to.equal(404);
	});
});
