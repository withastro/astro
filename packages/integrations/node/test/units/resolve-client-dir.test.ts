import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveClientDir } from '../../dist/shared.js';

const baseOptions = {
	mode: 'middleware' as const,
	host: false as const,
	port: 4321,
	staticHeaders: false,
	bodySizeLimit: 0,
};

// `resolveClientDir` walks up from the location of `dist/shared.js`, so using its
// own directory as the server folder lets the resolution run without a full build.
const sharedDir = path.dirname(fileURLToPath(new URL('../../dist/shared.js', import.meta.url)));
const serverFolder = path.basename(sharedDir);

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

	it('resolves the client directory from the relative path', () => {
		const resolved = resolveClientDir({
			...baseOptions,
			client: '../client',
			server: serverFolder,
		});

		assert.equal(path.resolve(resolved), path.resolve(sharedDir, '../client'));
	});

	it('honors a relative path for non-sibling client and server directories', () => {
		const resolved = resolveClientDir({
			...baseOptions,
			client: '../assets/client',
			server: serverFolder,
		});

		assert.equal(path.resolve(resolved), path.resolve(sharedDir, '../assets/client'));
	});
});
