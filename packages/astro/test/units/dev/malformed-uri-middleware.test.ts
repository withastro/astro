import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { baseMiddleware } from '../../../dist/vite-plugin-astro-server/base.js';
import { trailingSlashMiddleware } from '../../../dist/vite-plugin-astro-server/trailing-slash.js';
import { createBasicSettings, createRequestAndResponse, defaultLogger } from '../test-utils.ts';

const MALFORMED_URLS = ['/fixture/%', '/fixture/%C0%AF', '/fixture/%E0%A4%A'];

describe('dev middleware — malformed percent-encoding', async () => {
	const settings = await createBasicSettings({ base: '/docs' });
	const middlewares = {
		trailingSlashMiddleware: trailingSlashMiddleware(settings),
		baseMiddleware: baseMiddleware(settings, defaultLogger),
	};

	for (const [name, middleware] of Object.entries(middlewares)) {
		for (const url of MALFORMED_URLS) {
			it(`${name} responds 400 for ${url} instead of forwarding an error`, () => {
				const { req, res } = createRequestAndResponse({ method: 'GET', url });
				let nextArgs: unknown[] | undefined;
				middleware(req, res, (...args: unknown[]) => {
					nextArgs = args;
				});
				assert.equal(nextArgs, undefined);
				assert.equal(res.statusCode, 400);
			});
		}
	}
});
