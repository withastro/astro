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
	'/src/pages/streaming.js': `export const GET = ({ locals }) => {
		let sentChunks = 0;

		const readableStream = new ReadableStream({
			async pull(controller) {
				if (sentChunks === 3) return controller.close();
				else sentChunks++;

				await new Promise(resolve => setTimeout(resolve, 1000));
				controller.enqueue(new TextEncoder().encode('hello'));
			},
			cancel() {
				locals.cancelledByTheServer = true;
			}
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/event-stream"
			}
		})
	}`,
	'/src/pages/setCookies.js': `export const GET = context => {
		const headers = new Headers();
    context.cookies.set('key1', 'value1');
    context.cookies.set('key2', 'value2');
    headers.append('set-cookie', 'key3=value3');
    headers.append('set-cookie', 'key4=value4');
		return new Response(null, { headers });
	}`,
};

describe('endpoints', () => {
	let container;
	let settings;

	before(async () => {
		const fixture = await createFixture(fileSystem);
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

	it('Headers with multiple values (set-cookie special case)', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.deepEqual(headers, {
			'x-single': 'single',
			'x-triple': 'one, two, three',
			'set-cookie': ['hello', 'world'],
			vary: 'Origin',
		});
	});

	it('Can bail on streaming', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/streaming',
		});

		container.handle(req, res);

		await new Promise((resolve) => setTimeout(resolve, 500));
		res.emit('close');

		try {
			await done;

			assert.ok(true);
		} catch (err) {
			assert.fail(err);
		}
	});

	it('Accept setCookie from both context and headers', async () => {
		const { req, res, done } = createRequestAndResponse({
			method: 'GET',
			url: '/setCookies',
		});
		container.handle(req, res);
		await done;
		const headers = res.getHeaders();
		assert.deepEqual(headers, {
			'set-cookie': ['key1=value1', 'key2=value2', 'key3=value3', 'key4=value4'],
			vary: 'Origin',
		});
	});
});
