import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolveClientDir } from '../../dist/shared.js';

const baseOptions = {
	mode: 'middleware' as const,
	host: false as const,
	port: 4321,
	staticHeaders: false,
	bodySizeLimit: 0,
	portableOutput: false,
};

describe('resolveClientDir', () => {
	it('throws a descriptive error with folder names (portableOutput)', () => {
		assert.throws(
			() =>
				resolveClientDir({
					...baseOptions,
					portableOutput: true,
					client: 'client',
					server: 'server',
				}),
			{
				message: /Could not find the server directory "server".*bundled into a single file/,
			},
		);
	});

	it('throws a descriptive error with file:// URLs (default)', () => {
		const root = new URL('project/dist/', pathToFileURL('/'));
		assert.throws(
			() =>
				resolveClientDir({
					...baseOptions,
					client: new URL('client/', root).href,
					server: new URL('server/', root).href,
				}),
			{
				message: /Could not find the server directory "server".*bundled into a single file/,
			},
		);
	});
});
