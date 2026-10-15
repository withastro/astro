import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { optimizeDeps, resolveConfig, type Plugin } from 'vite';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings, createFixture } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

const serverModuleExtensions = ['ts', 'js', 'mjs', 'mts'];
const dependencyNames = serverModuleExtensions.map((extension) => `scan-${extension}`);

describe('vite-plugin-environment server entries', () => {
	it('discovers dependencies imported from supported server module extensions', async () => {
		const fixture = await createFixture({
			src: Object.fromEntries(
				serverModuleExtensions.map((extension) => [
					`entry.${extension}`,
					`import 'scan-${extension}';`,
				]),
			),
			node_modules: Object.fromEntries(
				dependencyNames.map((name) => [
					name,
					{
						'package.json': JSON.stringify({ name, version: '1.0.0', exports: './index.js' }),
						'index.js': 'export default true;',
					},
				]),
			),
		});

		try {
			const settings = await createBasicSettings({ root: fixture.path });
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

			const result = await configEnvironment.call(
				{} as never,
				'ssr',
				{ optimizeDeps: { noDiscovery: false } },
				{} as never,
			);
			const config = await resolveConfig(
				{
					root: fixture.path,
					logLevel: 'silent',
					optimizeDeps: { ...result?.optimizeDeps, force: true },
				},
				'serve',
			);
			const metadata = await optimizeDeps(config, true);

			assert.deepEqual(Object.keys(metadata.optimized).sort(), dependencyNames.sort());
		} finally {
			await fixture.rm();
		}
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

		const result = await configEnvironment.call({} as never, 'ssr', {}, {} as never);

		const entries = result?.optimizeDeps?.entries;
		assert.equal(
			entries,
			undefined,
			'server environment should not set entries when noDiscovery is not false',
		);
	});
});
