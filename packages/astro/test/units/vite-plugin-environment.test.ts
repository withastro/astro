import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { vitePluginEnvironment } from '../../dist/vite-plugin-environment/index.js';
import { createBasicSettings } from './test-utils.ts';

/** Minimal crawl result with no framework packages. */
const emptyCrawlResult = {
	optimizeDeps: { include: [] as string[], exclude: [] as string[] },
	ssr: { noExternal: [] as string[], external: [] as string[] },
};

/**
 * Extract the brace-expansion portion of a glob pattern to check extensions.
 * e.g. "src/**\/*.{jsx,tsx,vue,svelte,html,astro}" → "jsx,tsx,vue,svelte,html,astro"
 */
function extractExtensions(glob: string): string[] {
	const match = glob.match(/\.\{([^}]+)\}$/);
	return match ? match[1].split(',') : [];
}

describe('vitePluginEnvironment', () => {
	it('includes .astro in client optimizeDeps entries (#16630)', async () => {
		const settings = await createBasicSettings();
		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: emptyCrawlResult,
		});

		// configEnvironment returns EnvironmentOptions for the given environment name
		const hook = plugin.configEnvironment;
		assert.ok(typeof hook === 'function', 'configEnvironment hook should be a function');

		// Call with the expected Vite signature: (name, config, env)
		const clientOptions = (hook as Function).call(
			plugin,
			'client',
			{},
			{ command: 'serve', mode: 'development' },
		);
		assert.ok(clientOptions?.optimizeDeps?.entries, 'client should have optimizeDeps.entries');

		const entries = clientOptions.optimizeDeps.entries;
		assert.ok(Array.isArray(entries), 'entries should be an array');
		assert.equal(entries.length, 1, 'entries should have exactly one glob pattern');

		const glob = entries[0];
		const extensions = extractExtensions(glob);

		// .astro must be in the extension list so Vite's dep scanner discovers
		// <script> tag imports in .astro files for the client optimizer
		assert.ok(
			extensions.includes('astro'),
			`client optimizeDeps.entries extensions should include 'astro', got: {${extensions.join(',')}}`,
		);

		// Verify other expected extensions are also present
		for (const ext of ['jsx', 'tsx', 'vue', 'svelte', 'html']) {
			assert.ok(
				extensions.includes(ext),
				`entries extensions should include '${ext}', got: {${extensions.join(',')}}`,
			);
		}
	});

	it('includes .astro in SSR/prerender/astro optimizeDeps entries', async () => {
		const settings = await createBasicSettings();
		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: emptyCrawlResult,
		});

		const hook = plugin.configEnvironment;
		assert.ok(typeof hook === 'function');

		for (const envName of ['ssr', 'prerender', 'astro']) {
			// Pass noDiscovery: false to trigger the shared entries block
			const options = (hook as Function).call(
				plugin,
				envName,
				{ optimizeDeps: { noDiscovery: false } },
				{ command: 'serve', mode: 'development' },
			);
			assert.ok(options?.optimizeDeps?.entries, `${envName} should have optimizeDeps.entries`);
			const glob = options.optimizeDeps.entries[0];
			const extensions = extractExtensions(glob);
			assert.ok(
				extensions.includes('astro'),
				`${envName} optimizeDeps.entries should include .astro extension, got: {${extensions.join(',')}}`,
			);
		}
	});
});
