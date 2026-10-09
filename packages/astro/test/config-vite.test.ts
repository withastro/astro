import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, resolveConfig } from 'vite';
import { getViteConfig } from '../dist/config/index.js';

// The "Vite Config" build test (overriding bundle naming options) has been
// converted to a unit test in test/units/build/vite-build-config.test.ts.

describe('getViteConfig', () => {
	let originalCwd: string;
	before(() => {
		originalCwd = process.cwd();
		// We chdir because otherwise it sets the wrong root in the site config
		process.chdir(fileURLToPath(new URL('./fixtures/config-vite/', import.meta.url)));
	});
	it('Does not change the default config.', async () => {
		const command = 'serve';
		const mode = 'test';
		const configFn = getViteConfig({}, { logLevel: 'silent' });
		const config = await configFn({ command, mode });
		const resolvedConfig = await resolveConfig(config, command, mode);
		assert.deepStrictEqual(resolvedConfig.resolve.conditions, [
			...defaultClientConditions,
			'astro',
		]);
	});
	after(() => {
		process.chdir(originalCwd);
	});
});
