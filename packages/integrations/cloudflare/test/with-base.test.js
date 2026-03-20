import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';
import { Logger } from '../../../astro/dist/core/logger/core.js';
import { fileURLToPath } from 'node:url';

describe('base', () => {
	let fixture;
	const logs = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-base/',
		});

		// Clear the Vite cache before testing
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);

		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		await fixture.build({
			vite: { logLevel: 'debug' },
			logger: new Logger({
				level: 'debug',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
	});

	after(async () => {
		await fixture.clean();
	});

	it('correctly prints redirects', async () => {
		const fileContent = await fixture.readFile('client/_redirects');
		assert.match(fileContent, /\/a\/redirect\s+\/\s+301/);
		assert.match(fileContent, /\/a\/redirect\/\s+\/\s+301/);
	});
});
