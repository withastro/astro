import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/no-output/', import.meta.url);

describe('MissingOutputConfig', () => {
	it('throws during the build', async () => {
		let error = undefined;
		try {
			await astroCli(fileURLToPath(root), 'build');
		} catch (err) {
			error = err;
		}
		assert.notEqual(error, undefined);
		assert.ok(
			error.message.includes(
				'[@astrojs/cloudflare] `output: "server"` or `output: "hybrid"` is required to use this adapter.'
			)
		);
	});
});
