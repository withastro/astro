import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import nodeFs from 'node:fs';
import { astroContentVirtualModPlugin } from '../../../dist/content/vite-plugin-content-virtual-mod.js';
import { createMinimalSettings, createTempDir } from './test-helpers.ts';

/**
 * Creates a minimal mock environment module graph.
 */
function createMockModuleGraph() {
	return {
		getModuleById: () => null,
		getModulesByFile: () => null,
		invalidateModule: () => {},
	};
}

/**
 * Creates a minimal mock ViteDevServer with just enough structure for
 * the content virtual mod plugin's buildStart hook.
 */
function createMockViteDevServer() {
	const sentMessages: Array<Record<string, unknown>> = [];
	return {
		sentMessages,
		environments: {
			ssr: {
				moduleGraph: createMockModuleGraph(),
				hot: {
					send: (type: unknown, data: unknown) => {
						sentMessages.push({ channel: 'ssr', type, data });
					},
				},
			},
			client: {
				moduleGraph: createMockModuleGraph(),
				hot: {
					send: (payload: Record<string, unknown>) => {
						sentMessages.push({ channel: 'client', ...payload });
					},
				},
			},
		},
		watcher: {
			add: () => {},
			on: () => {},
		},
	};
}

describe('astroContentVirtualModPlugin', () => {
	it('does not send full-reload to client during buildStart', () => {
		const root = createTempDir('content-virtual-mod-test-');
		const settings = createMinimalSettings(root, {
			config: {
				legacy: {},
			},
		});
		settings.injectedTypes = [];

		const plugin = astroContentVirtualModPlugin({ settings, fs: nodeFs });

		// Simulate Vite's plugin lifecycle: config → configureServer → buildStart
		// @ts-expect-error - mock args are sufficient for this test
		plugin.config?.({}, { command: 'serve' });

		const mockServer = createMockViteDevServer();
		// @ts-expect-error - mock server has enough structure for this test
		plugin.configureServer?.(mockServer);

		// buildStart is where the bug was: it called invalidateDataStore which sent full-reload
		// @ts-expect-error - calling without full Rollup context
		plugin.buildStart?.();

		// Verify no full-reload was sent to the client
		const clientReloads = mockServer.sentMessages.filter(
			(msg) => msg.channel === 'client' && msg.type === 'full-reload',
		);
		assert.equal(
			clientReloads.length,
			0,
			'buildStart should not send full-reload to client during startup',
		);
	});
});
