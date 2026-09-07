import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SessionSchema } from '../../../dist/core/session/config.js';
import { sessionConfigToManifest } from '../../../dist/core/session/utils.js';
import { getUsedFeatures } from '../../../dist/core/fetch/features.js';
import { provideSession } from '../../../dist/core/session/provider-disabled.js';
import { vitePluginSessionProvider } from '../../../dist/core/session/vite-plugin.js';

describe('session: false', () => {
	describe('schema', () => {
		it('accepts `session: false`', () => {
			const result = SessionSchema.safeParse(false);
			assert.equal(result.success, true);
			if (result.success) {
				assert.equal(result.data, false);
			}
		});

		it('still accepts a session object', () => {
			const result = SessionSchema.safeParse({ ttl: 60 });
			assert.equal(result.success, true);
		});

		it('rejects other falsy values', () => {
			assert.equal(SessionSchema.safeParse(0).success, false);
			assert.equal(SessionSchema.safeParse('').success, false);
			assert.equal(SessionSchema.safeParse(null).success, false);
		});
	});

	describe('manifest helpers', () => {
		it('sessionConfigToManifest(false) returns undefined', () => {
			assert.equal(sessionConfigToManifest(false), undefined);
		});
	});

	describe('disabled provider', () => {
		it('registers no session provider, leaving Astro.session undefined', () => {
			let provideCalled = false;
			const manifest = {} as never;
			const fakeState = {
				manifest,
				provide() {
					provideCalled = true;
				},
			};
			provideSession(fakeState as never);
			assert.equal(provideCalled, false, 'disabled provider should not register a session');
			assert.notEqual(getUsedFeatures(manifest), 0, 'sessions feature should be marked used');
		});
	});

	describe('provider plugin', () => {
		const sessionDir = fileURLToPath(new URL('../../../dist/core/session/', import.meta.url));
		// `canonicalizePath` in the plugin normalizes to forward slashes.
		const toPosix = (filePath: string) => realpathSync(filePath).replaceAll('\\', '/');
		const expectedDisabledPath = toPosix(join(sessionDir, 'provider-disabled.js'));

		let tempDir: string;
		// Reaches the real provider through a symlink, as Vite does under
		// `resolve.preserveSymlinks: true`.
		let symlinkedProviderPath: string;

		before(() => {
			tempDir = mkdtempSync(join(realpathSync(tmpdir()), 'astro-session-symlink-'));
			// `junction` works on Windows without elevated privileges; the type
			// argument is ignored elsewhere.
			symlinkSync(sessionDir, join(tempDir, 'session'), 'junction');
			symlinkedProviderPath = join(tempDir, 'session', 'provider.js');
		});

		after(() => {
			rmSync(tempDir, { recursive: true, force: true });
		});

		function createPlugin(session: unknown) {
			return vitePluginSessionProvider({ settings: { config: { session } } } as never);
		}

		/** Calls the plugin's `resolveId` with a stubbed Rollup context. */
		function resolveId(
			plugin: ReturnType<typeof createPlugin>,
			id: string,
			importer: string | undefined,
			resolvesTo?: string,
		) {
			const context = {
				resolve: async () => (resolvesTo ? { id: resolvesTo } : null),
			};
			return (plugin.resolveId as any).call(context, id, importer);
		}

		it('redirects a symlinked provider path reached through resolution', async () => {
			const result = await resolveId(
				createPlugin(false),
				'../session/provider.js',
				join(sessionDir, '..', 'fetch', 'index.js'),
				symlinkedProviderPath,
			);
			assert.equal(
				result,
				expectedDisabledPath,
				"a symlinked resolution of Astro's provider should still be redirected",
			);
		});

		it('redirects a symlinked provider path passed directly', async () => {
			const result = await resolveId(createPlugin(false), symlinkedProviderPath, undefined);
			assert.equal(result, expectedDisabledPath);
		});

		it('redirects the canonical provider path', async () => {
			const result = await resolveId(
				createPlugin(false),
				join(sessionDir, 'provider.js'),
				undefined,
			);
			assert.equal(result, expectedDisabledPath);
		});

		it('leaves an unrelated `session/provider.js` alone', async () => {
			const result = await resolveId(
				createPlugin(false),
				'./session/provider.js',
				'/project/src/pages/index.astro',
				'/project/src/session/provider.js',
			);
			assert.equal(result, null, 'user code should not be hijacked');
		});

		it('keeps the real provider when a driver is configured', async () => {
			const result = await resolveId(
				createPlugin({ driver: 'fs-lite' }),
				symlinkedProviderPath,
				undefined,
			);
			assert.equal(result, null);
		});
	});
});
