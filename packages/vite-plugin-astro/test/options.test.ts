import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroPluginOptionsSchema } from '../dist/index.js';

describe('AstroPluginOptionsSchema', () => {
	it('applies defaults', () => {
		assert.deepEqual(AstroPluginOptionsSchema.parse({}), {
			publicDir: './public',
			compressHTML: 'jsx',
			trailingSlash: 'ignore',
			renderers: [],
			clientDirectives: [],
		});
	});

	it('accepts renderers and client directives with string or URL entrypoints', () => {
		const serverEntrypoint = new URL('file:///renderer/server.js');
		const parsed = AstroPluginOptionsSchema.parse({
			renderers: [{ name: 'test', serverEntrypoint, clientEntrypoint: '/client.js' }],
			clientDirectives: [{ name: 'click', entrypoint: './click.js' }],
		});
		assert.equal(parsed.renderers[0].serverEntrypoint, serverEntrypoint);
		assert.equal(parsed.clientDirectives[0].name, 'click');
	});

	it('rejects a renderer without a server entrypoint', () => {
		const result = AstroPluginOptionsSchema.safeParse({ renderers: [{ name: 'test' }] });
		assert.equal(result.success, false);
	});

	it('rejects an invalid trailingSlash value', () => {
		const result = AstroPluginOptionsSchema.safeParse({ trailingSlash: 'sometimes' });
		assert.equal(result.success, false);
	});

	it('rejects a site that is not an absolute URL', () => {
		const result = AstroPluginOptionsSchema.safeParse({ site: 'example.com' });
		assert.equal(result.success, false);
	});
});
