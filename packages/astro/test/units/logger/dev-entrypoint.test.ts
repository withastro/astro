import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import type { AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import { getLogger } from '../../../dist/core/logger/manifest-logger.js';
import { createManifest } from '../app/test-helpers.ts';

const stubs: Record<string, string> = {
	'virtual:astro:manifest': new URL('./stubs/manifest.mjs', import.meta.url).href,
	'virtual:astro:fetchable': new URL('./stubs/fetchable.mjs', import.meta.url).href,
};

registerHooks({
	resolve(specifier, context, nextResolve) {
		const url = stubs[specifier];
		if (url) {
			return { url, shortCircuit: true };
		}
		return nextResolve(specifier, context);
	},
});

describe('non-runnable dev entrypoint logger', () => {
	it('logs at the manifest log level', async () => {
		const manifest = createManifest({ logLevel: 'info' });
		(globalThis as any).__astroDevEntrypointManifest = manifest;

		const { createApp } = await import('../../../dist/core/app/entrypoints/virtual/dev.js');
		createApp();

		const messages: AstroLoggerMessage[] = [];
		const logger = getLogger(manifest);
		logger.setDestination({ write: (chunk) => void messages.push(chunk) });

		assert.equal(logger.level(), 'info');

		logger.error(null, 'boom');
		logger.info(null, 'hello');
		assert.deepEqual(
			messages.map((message) => message.message),
			['boom', 'hello'],
		);
	});
});
