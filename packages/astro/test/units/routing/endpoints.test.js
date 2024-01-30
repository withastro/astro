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
	'/src/pages/response-redirect.ts': `export const GET = ({ url }) => Response.redirect("https://example.com/destination", 307)`,
	'/src/pages/response.ts': `export const GET = ({ url }) => new Response(null, { headers: { Location: "https://example.com/destination" }, status: 307 })`,
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
		expect(res.getHeaders()).to.deep.include({ location: 'https://example.com/destination' });
		expect(res.statusCode).to.equal(307);
	});

	it('should return a response with location header', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/response',
		});
		container.handle(req, res);
		await done;
		expect(res.getHeaders()).to.deep.include({ location: 'https://example.com/destination' });
		expect(res.statusCode).to.equal(307);
	});
});
