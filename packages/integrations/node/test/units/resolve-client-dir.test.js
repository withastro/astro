import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveClientDir } from '../../dist/shared.js';

describe('resolveClientDir', () => {
	it('throws a descriptive error when the server folder is not found in the path', () => {
		// When import.meta.url (of shared.js) does not contain a "server" segment,
		// the while loop should terminate and throw instead of looping forever.
		// This simulates what happens when the entry point is bundled with esbuild
		// into a path that lacks the expected "server" directory segment.
		assert.throws(
			() =>
				resolveClientDir({
					client: 'file:///project/dist/client/',
					server: 'file:///project/dist/server/',
					mode: 'middleware',
					host: false,
					port: 4321,
					staticHeaders: false,
					bodySizeLimit: 0,
				}),
			{
				message: /Could not find the server directory "server".*bundled into a single file/,
			},
		);
	});
});
