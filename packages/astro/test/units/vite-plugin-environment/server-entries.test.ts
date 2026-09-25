import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as vite from 'vite';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: vite.Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

describe('vite-plugin-environment server entries', () => {
	it('includes .ts and .js files in server optimizeDeps.entries when noDiscovery is false', async () => {
		const settings = await createBasicSettings();
		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});

		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		// Simulate the Cloudflare adapter setting noDiscovery: false
		const options = {
			optimizeDeps: { noDiscovery: false },
		} as vite.EnvironmentOptions;

		const result = await configEnvironment!.call({} as any, 'ssr', options, {} as any);

		const entries = (result as vite.EnvironmentOptions)?.optimizeDeps?.entries;
		assert.ok(
			entries,
			'server environment should have optimizeDeps.entries when noDiscovery is false',
		);
		assert.ok(Array.isArray(entries), 'entries should be an array');

		const entryPattern = entries[0];
		assert.match(
			entryPattern,
			/\{[^}]*\bts\b[^}]*\}/,
			`server entries glob should include "ts" in its extension list, got: ${entryPattern}`,
		);
		assert.match(
			entryPattern,
			/\{[^}]*\bjs\b[^}]*\}/,
			`server entries glob should include "js" in its extension list, got: ${entryPattern}`,
		);
	});

	it('does not set entries when noDiscovery is not false', async () => {
		const settings = await createBasicSettings();
		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});

		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		const result = await configEnvironment!.call({} as any, 'ssr', {} as any, {} as any);

		const entries = (result as vite.EnvironmentOptions)?.optimizeDeps?.entries;
		assert.equal(
			entries,
			undefined,
			'server environment should not set entries when noDiscovery is not false',
		);
	});
});
