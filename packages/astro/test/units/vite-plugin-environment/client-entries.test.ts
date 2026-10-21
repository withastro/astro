import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as vite from 'vite';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: vite.Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

describe('vite-plugin-environment client entries', () => {
	it('includes .astro files in client optimizeDeps.entries so script-tag imports are scanned', async () => {
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

		const result = await configEnvironment!.call({} as any, 'client', {} as any, {} as any);

		const entries = (result as vite.EnvironmentOptions)?.optimizeDeps?.entries;
		assert.ok(entries, 'client environment should have optimizeDeps.entries');
		assert.ok(Array.isArray(entries), 'entries should be an array');

		// The glob's extension list must include `astro` so Vite's dep scanner
		// processes <script> tags inside .astro files and discovers client-side
		// imports during the initial scan (avoiding late re-optimization 504s).
		const entryPattern = entries[0];
		assert.match(
			entryPattern,
			/\{[^}]*\bastro\b[^}]*\}/,
			`client entries glob should include "astro" in its extension list, got: ${entryPattern}`,
		);
	});

	it('includes .mdx files in client optimizeDeps.entries so content-entry framework imports are scanned', async () => {
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

		const result = await configEnvironment!.call({} as any, 'client', {} as any, {} as any);

		const entries = (result as vite.EnvironmentOptions)?.optimizeDeps?.entries;
		assert.ok(entries, 'client environment should have optimizeDeps.entries');
		assert.ok(Array.isArray(entries), 'entries should be an array');

		// Framework components imported from MDX content entries are only reachable
		// through the virtual astro:content module, which the dep scanner cannot
		// follow. Including the extension here lets the initial scan pre-bundle their
		// framework dependencies, avoiding a late re-optimization full-reload.
		// Plain .md files cannot import components, so only .mdx needs scanning.
		const entryPattern = entries[0];
		assert.match(
			entryPattern,
			/\{[^}]*\bmdx\b[^}]*\}/,
			`client entries glob should include "mdx" in its extension list, got: ${entryPattern}`,
		);
	});
});
