import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import router, { RouterPluginOptionsSchema } from '../dist/index.js';

describe('RouterPluginOptionsSchema', () => {
	it('applies defaults', () => {
		const options = RouterPluginOptionsSchema.parse({});
		assert.equal(options.srcDir, './src');
		assert.equal(options.output, 'static');
		assert.equal(options.build.format, 'directory');
		assert.equal(options.build.serverEntry, 'entry.mjs');
		assert.deepEqual(options.redirects, {});
		assert.equal(options.security.checkOrigin, true);
		assert.deepEqual(options.security.allowedDomains, []);
	});

	it('accepts redirect objects with a valid status', () => {
		const options = RouterPluginOptionsSchema.parse({
			redirects: { '/old': '/new', '/a': { status: 301, destination: '/b' } },
		});
		assert.deepEqual(options.redirects['/a'], { status: 301, destination: '/b' });
	});

	it('rejects invalid options', () => {
		assert.throws(() => RouterPluginOptionsSchema.parse({ output: 'hybrid' }));
		assert.throws(() =>
			RouterPluginOptionsSchema.parse({ redirects: { '/a': { status: 200, destination: '/b' } } }),
		);
		assert.throws(() => router({ build: { format: 'nested' as never } }));
	});
});
