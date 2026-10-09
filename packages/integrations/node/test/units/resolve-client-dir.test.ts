import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveClientDir } from '../../dist/shared.js';

const baseOptions = {
	mode: 'middleware' as const,
	host: false as const,
	port: 4321,
	staticHeaders: false,
	bodySizeLimit: 0,
};

describe('resolveClientDir', () => {
	it('throws a descriptive error when the server folder is not found in the path', () => {
		assert.throws(
			() =>
				resolveClientDir({
					...baseOptions,
					client: 'client',
					server: 'server',
				}),
			{
				message: /Could not find the server directory "server".*bundled into a single file/,
			},
		);
	});
});
