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
	'/src/pages/api.ts': `export const GET = ({ url }) => Response.redirect("https://example.com/destination", 307)`,
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
		const { req, res, text, done } = createRequestAndResponse({
			method: 'GET',
			url: '/api',
		});
		container.handle(req, res);
		await done;
		expect(res.getHeaders()).to.deep.include({ location: 'https://example.com/destination' });
		expect(res.statusCode).to.equal(307);
	});
});
