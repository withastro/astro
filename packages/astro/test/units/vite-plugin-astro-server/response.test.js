import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
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
	'/src/pages/index.js': `export const GET = () => {
		const headers = new Headers();
		headers.append('x-single', 'single');
		headers.append('x-triple', 'one');
		headers.append('x-triple', 'two');
		headers.append('x-triple', 'three');
		headers.append('Set-cookie', 'hello');
		headers.append('Set-Cookie', 'world');
		return new Response(null, { headers });
	}`,
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

	it('Headers with multiple values (set-cookie special case)', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		expect(headers).to.deep.equal({
			'access-control-allow-origin': '*',
			'x-single': 'single',
			'x-triple': 'one, two, three',
			'set-cookie': ['hello', 'world'],
		});
	});
});
