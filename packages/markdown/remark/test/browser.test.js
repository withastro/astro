import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import esbuild from 'esbuild';

describe('Bundle for browsers', async () => {
	it('esbuild browser build should work', async () => {
		try {
			const result = await esbuild.build({
				platform: 'browser',
				// ESM output so top-level await (used by satteri's WASM loader) is supported.
				// The default IIFE format would reject the TLA in satteri's browser shim.
				format: 'esm',
				entryPoints: ['@astrojs/markdown-remark'],
				bundle: true,
				write: false,
			});
			assert.ok(result.outputFiles.length > 0);
		} catch (error) {
			// Capture any esbuild errors and fail the test
			assert.fail(error.message);
		}
	});
});
