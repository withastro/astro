import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { baseMiddleware } from '../../../dist/vite-plugin-astro-server/base.js';
import { trailingSlashMiddleware } from '../../../dist/vite-plugin-astro-server/trailing-slash.js';
import { createBasicSettings, createRequestAndResponse, defaultLogger } from '../test-utils.ts';

const malformedPaths = ['/%', '/%C0%AF'];

async function runMiddleware(
	middleware: (
		req: Parameters<ReturnType<typeof baseMiddleware>>[0],
		res: Parameters<ReturnType<typeof baseMiddleware>>[1],
		next: Parameters<ReturnType<typeof baseMiddleware>>[2],
	) => void,
	url: string,
): Promise<{ nextCalled: boolean; statusCode: number }> {
	const { req, res, done } = createRequestAndResponse({
		method: 'GET',
		url,
	});

	let nextCalled = false;
	middleware(req, res, () => {
		nextCalled = true;
		res.statusCode = 200;
		res.end('ok');
	});

	await done;
	return {
		nextCalled,
		statusCode: res.statusCode,
	};
}

describe('dev middleware — malformed percent-encoding', () => {
	it('baseMiddleware returns 400 for malformed paths', async () => {
		const settings = await createBasicSettings({});
		const middleware = baseMiddleware(settings, defaultLogger);

		for (const url of malformedPaths) {
			const result = await runMiddleware(middleware, url);
			assert.equal(result.nextCalled, false, `${url} should not call next()`);
			assert.equal(result.statusCode, 400, `${url} should return 400, not 500`);
		}
	});

	it('trailingSlashMiddleware returns 400 for malformed paths', async () => {
		const settings = await createBasicSettings({});
		const middleware = trailingSlashMiddleware(settings);

		for (const url of malformedPaths) {
			const result = await runMiddleware(middleware, url);
			assert.equal(result.nextCalled, false, `${url} should not call next()`);
			assert.equal(result.statusCode, 400, `${url} should return 400, not 500`);
		}
	});
});
