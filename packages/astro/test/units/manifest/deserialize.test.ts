import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizePath } from 'vite';
import { deserializeManifest, resolvePortableKey } from '../../../dist/core/app/manifest.js';
import {
	adjustManifestPathsForChunk,
	relativizeManifestKeys,
	toPortableManifest,
} from '../../../dist/core/build/plugins/plugin-manifest.js';
import type { SerializedSSRManifest } from '../../../dist/core/app/types.js';

/** A valid 32-byte AES key so `decodeKey` does not throw before the assertions run. */
const encodedKey = Buffer.from(new Uint8Array(32)).toString('base64');

/**
 * Builds the smallest serialized manifest that `deserializeManifest` accepts. Directory strings
 * default to what `toPortableManifest` produces: relative to the server entry directory.
 */
function createSerializedManifest(
	overrides: Partial<SerializedSSRManifest> = {},
): SerializedSSRManifest {
	return {
		adapterName: 'test-adapter',
		routes: [],
		assets: [],
		componentMetadata: [],
		inlinedScripts: [],
		clientDirectives: [],
		entryModules: {},
		key: encodedKey,
		rootDir: '../../',
		srcDir: '../../src/',
		publicDir: '../../public/',
		outDir: './',
		cacheDir: '../../node_modules/.astro/',
		buildClientDir: '../client/',
		buildServerDir: './',
		absoluteServerDir: 'file:///build/project/dist/server/',
		...overrides,
	} as unknown as SerializedSSRManifest;
}

describe('deserializeManifest - portable directories', () => {
	it('resolves relative directories against the server entry URL', () => {
		const manifest = deserializeManifest(
			createSerializedManifest(),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.buildServerDir.href, 'file:///deploy/dist/server/');
		assert.equal(manifest.buildClientDir.href, 'file:///deploy/dist/client/');
		assert.equal(manifest.outDir.href, 'file:///deploy/dist/server/');
		assert.equal(manifest.rootDir.href, 'file:///deploy/');
		assert.equal(manifest.srcDir.href, 'file:///deploy/src/');
		assert.equal(manifest.cacheDir.href, 'file:///deploy/node_modules/.astro/');
	});

	it('resolves paths from a nested manifest chunk', () => {
		const serialized = adjustManifestPathsForChunk(
			createSerializedManifest(),
			'chunks/_manifest.mjs',
		);

		assert.equal(serialized.buildClientDir, '../../client/');
		assert.equal(serialized.rootDir, '../../../');

		const manifest = deserializeManifest(
			serialized,
			undefined,
			'file:///deploy/dist/server/chunks/_manifest.mjs',
		);

		assert.equal(manifest.buildClientDir.href, 'file:///deploy/dist/client/');
		assert.equal(manifest.rootDir.href, 'file:///deploy/');
	});

	it('resolves paths from a deeply nested manifest chunk', () => {
		const serialized = adjustManifestPathsForChunk(
			createSerializedManifest(),
			'a/b/c/_manifest.mjs',
		);

		assert.equal(serialized.buildClientDir, '../../../../client/');

		const manifest = deserializeManifest(
			serialized,
			undefined,
			'file:///deploy/dist/server/a/b/c/_manifest.mjs',
		);

		assert.equal(manifest.buildClientDir.href, 'file:///deploy/dist/client/');
	});

	it('resolves paths from a nested manifest chunk on a runtime with an opaque entry URL', () => {
		const serialized = adjustManifestPathsForChunk(
			createSerializedManifest(),
			'chunks/_manifest.mjs',
		);

		const manifest = deserializeManifest(serialized, undefined, 'blob:https://example.com/abc');

		assert.equal(manifest.rootDir.href, 'file:///build/project/');
		assert.equal(manifest.outDir.href, 'file:///build/project/dist/server/');
		assert.equal(manifest.buildClientDir.href, 'file:///build/project/dist/client/');
		assert.equal(manifest.buildServerDir.href, 'file:///build/project/dist/server/');
	});

	it('keeps absolute file URLs from the prerender manifest', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ buildClientDir: 'file:///absolute/client/' }),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.buildClientDir.href, 'file:///absolute/client/');
	});

	it('resolves relative directories against the build server directory when the server entry URL is opaque', () => {
		const manifest = deserializeManifest(
			createSerializedManifest(),
			undefined,
			'blob:https://example.com/abc',
		);

		assert.equal(manifest.rootDir.href, 'file:///build/project/');
		assert.equal(manifest.buildClientDir.href, 'file:///build/project/dist/client/');
		assert.equal(manifest.buildServerDir.href, 'file:///build/project/dist/server/');
	});

	it('falls back to file:/// when the entry URL is opaque and the manifest records no absolute server directory', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ absoluteServerDir: undefined }),
			undefined,
			'blob:https://example.com/abc',
		);

		assert.equal(manifest.rootDir.href, 'file:///');
		assert.equal(manifest.buildClientDir.href, 'file:///');
	});

	it('still resolves absolute file URLs when the server entry URL is opaque', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ buildClientDir: 'file:///absolute/client/' }),
			undefined,
			'blob:https://example.com/abc',
		);

		assert.equal(manifest.buildClientDir.href, 'file:///absolute/client/');
	});

	it('resolves relative directories against the build server directory without a server entry URL', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ buildClientDir: 'file:///absolute/client/' }),
		);

		assert.equal(manifest.buildClientDir.href, 'file:///absolute/client/');
		assert.equal(manifest.rootDir.href, 'file:///build/project/');
	});
});

describe('adjustManifestPathsForChunk', () => {
	it('returns the manifest unchanged for a top-level chunk', () => {
		const manifest = createSerializedManifest();
		assert.equal(adjustManifestPathsForChunk(manifest, '_manifest.mjs'), manifest);
	});

	it('prefixes one parent segment per chunk directory level', () => {
		const manifest = createSerializedManifest();
		const adjusted = adjustManifestPathsForChunk(manifest, 'chunks/_manifest.mjs');

		assert.equal(adjusted.buildClientDir, '../' + manifest.buildClientDir);
		assert.equal(adjusted.rootDir, '../' + manifest.rootDir);
		assert.equal(adjusted.buildServerDir, '../' + manifest.buildServerDir);
	});

	it('keeps absolute file URLs unchanged', () => {
		const manifest = createSerializedManifest({ buildClientDir: 'file:///absolute/client/' });
		const adjusted = adjustManifestPathsForChunk(manifest, 'chunks/_manifest.mjs');

		assert.equal(adjusted.buildClientDir, 'file:///absolute/client/');
		assert.equal(adjusted.rootDir, '../' + manifest.rootDir);
	});

	it('moves the absolute server fallback to the chunk directory', () => {
		const adjusted = adjustManifestPathsForChunk(
			createSerializedManifest(),
			'chunks/_manifest.mjs',
		);

		assert.equal(adjusted.absoluteServerDir, 'file:///build/project/dist/server/chunks/');
	});
});

describe('toPortableManifest', () => {
	// Build file URLs from a platform-valid root: `fileURLToPath`, which `toPortableManifest`
	// calls, requires a drive letter on Windows, so a POSIX-style `file:///project/` URL would
	// throw before the assertions run.
	const root = pathToFileURL('/');

	function createSettings(outDir = new URL('project/dist/', root)) {
		return {
			config: {
				root: new URL('project/', root),
				cacheDir: new URL('project/node_modules/.astro/', root),
				outDir,
				srcDir: new URL('project/src/', root),
				publicDir: new URL('project/public/', root),
				build: {
					server: new URL('project/dist/server/', root),
					client: new URL('project/dist/client/', root),
				},
			},
			renderers: [],
		} as never;
	}

	it('serializes a directory equal to the server directory as ./', () => {
		const settings = createSettings(new URL('project/dist/server/', root));
		const result = toPortableManifest(createSerializedManifest(), settings);

		assert.equal(result.outDir, './');
		assert.equal(result.buildServerDir, './');
	});

	it('serializes sibling and parent directories relative to the server directory', () => {
		const result = toPortableManifest(createSerializedManifest(), createSettings());

		assert.equal(result.buildClientDir, '../client/');
		assert.equal(result.rootDir, '../../');
		assert.equal(result.srcDir, '../../src/');
		assert.equal(result.cacheDir, '../../node_modules/.astro/');
	});

	it('records the absolute build server directory as a fallback', () => {
		const result = toPortableManifest(createSerializedManifest(), createSettings());

		assert.equal(result.absoluteServerDir, new URL('project/dist/server/', root).href);
	});

	it('recovers the configured directories on a runtime with an opaque entry URL', () => {
		const serialized = toPortableManifest(createSerializedManifest(), createSettings());
		const manifest = deserializeManifest(serialized, undefined, 'blob:https://example.com/abc');

		assert.equal(manifest.rootDir.href, new URL('project/', root).href);
		assert.equal(manifest.srcDir.href, new URL('project/src/', root).href);
		assert.equal(manifest.outDir.href, new URL('project/dist/', root).href);
		assert.equal(manifest.cacheDir.href, new URL('project/node_modules/.astro/', root).href);
		assert.equal(manifest.buildClientDir.href, new URL('project/dist/client/', root).href);
	});

	it('resolves the serialized server directory back to the server entry directory', () => {
		const settings = createSettings(new URL('project/dist/server/', root));
		const serialized = toPortableManifest(createSerializedManifest(), settings);

		const manifest = deserializeManifest(
			serialized,
			undefined,
			'file:///project/dist/server/entry.mjs',
		);

		assert.equal(manifest.outDir.href, 'file:///project/dist/server/');
	});
});

describe('relativizeManifestKeys', () => {
	// Only `config.root` and `renderers` are read, so a minimal settings object is enough.
	// Build the root from a platform-valid URL: `fileURLToPath`, which `relativizeManifestKeys`
	// calls, requires a drive letter on Windows, so a POSIX-style `file:///project/` URL would
	// throw before the assertions run.
	const projectRoot = new URL('project/', pathToFileURL('/'));
	const projectBase = normalizePath(fileURLToPath(projectRoot));
	/** A project-absolute path with the current platform's root prefix. */
	const projectKey = (relative: string) => projectBase + relative;
	const settings = { config: { root: projectRoot }, renderers: [] } as never;

	it('relativizes keys inside the project root', () => {
		const manifest = createSerializedManifest({
			componentMetadata: [
				[projectKey('src/pages/index.astro'), { propagation: 'none', containsHead: false }],
			],
			inlinedScripts: [[projectKey('src/pages/index.astro?astro&type=script&index=0'), 'code']],
			entryModules: { [projectKey('src/components/Foo.astro')]: 'chunk.mjs' },
		});

		const result = relativizeManifestKeys(manifest, settings);

		assert.deepEqual(result.componentMetadata, [
			['/src/pages/index.astro', { propagation: 'none', containsHead: false }],
		]);
		assert.deepEqual(result.inlinedScripts, [
			['/src/pages/index.astro?astro&type=script&index=0', 'code'],
		]);
		assert.deepEqual(result.entryModules, { '/src/components/Foo.astro': 'chunk.mjs' });
	});

	it('keeps keys outside the project root verbatim', () => {
		// `file://` renderer entrypoints must not be run through `normalizePath`, which would
		// collapse `file:///` to `file:/` and make the runtime lookup fail.
		const manifest = createSerializedManifest({
			entryModules: {
				'file:///project/renderers/woof/woof-client.mjs': 'chunk.mjs',
				'/other/absolute/module.mjs': 'other.mjs',
				react: 'react.mjs',
				'\0virtual:astro:page:/app/src/pages/index@_@astro': 'page.mjs',
			},
		});

		const result = relativizeManifestKeys(manifest, settings);

		assert.deepEqual(result.entryModules, manifest.entryModules);
	});

	it('keeps renderer entrypoints inside the project root absolute', () => {
		// The runtime resolves renderer entrypoints from the renderer config, which is not
		// rewritten, so their manifest keys must match the absolute specifier.
		const clientEntrypoint = projectKey('node_modules/my-renderer/client.js');
		const settingsWithRenderer = {
			config: { root: projectRoot },
			renderers: [{ name: 'my-renderer', clientEntrypoint }],
		} as never;
		const manifest = createSerializedManifest({
			entryModules: {
				[clientEntrypoint]: 'renderer.mjs',
				[projectKey('src/components/Foo.astro')]: 'chunk.mjs',
			},
		});

		const result = relativizeManifestKeys(manifest, settingsWithRenderer);

		assert.deepEqual(result.entryModules, {
			[clientEntrypoint]: 'renderer.mjs',
			'/src/components/Foo.astro': 'chunk.mjs',
		});
	});
});

describe('resolvePortableKey', () => {
	const keys = new Set(['/src/components/Foo.astro', '/src/pages/index.astro?astro&type=script']);
	const has = (key: string) => keys.has(key);

	it('finds a root-relative key from an absolute specifier', () => {
		assert.equal(
			resolvePortableKey(has, '/home/user/project/src/components/Foo.astro'),
			'/src/components/Foo.astro',
		);
	});

	it('finds a root-relative key from a Windows specifier', () => {
		assert.equal(
			resolvePortableKey(has, 'C:\\build\\project\\src\\components\\Foo.astro'),
			'/src/components/Foo.astro',
		);
	});

	it('keeps the query string when matching a key', () => {
		assert.equal(
			resolvePortableKey(has, '/home/user/project/src/pages/index.astro?astro&type=script'),
			'/src/pages/index.astro?astro&type=script',
		);
	});

	it('returns undefined for a specifier that is not an absolute path', () => {
		assert.equal(resolvePortableKey(has, 'react'), undefined);
		assert.equal(resolvePortableKey(has, 'file:///project/src/components/Foo.astro'), undefined);
	});

	it('returns undefined when no key matches', () => {
		assert.equal(resolvePortableKey(has, '/home/user/project/src/other/Bar.astro'), undefined);
	});
});

describe('deserializeManifest - portable key fallback', () => {
	it('resolves an absolute specifier from an older integration', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({
				entryModules: { '/src/components/Foo.jsx': 'foo.mjs' },
				componentMetadata: [
					['/src/components/Foo.astro', { propagation: 'self', containsHead: false }],
				],
				inlinedScripts: [['/src/pages/index.astro?astro&type=script&index=0', 'code']],
			}),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.entryModules['/build/old/project/src/components/Foo.jsx'], 'foo.mjs');
		assert.ok('/build/old/project/src/components/Foo.jsx' in manifest.entryModules);
		assert.equal(
			manifest.componentMetadata.get('/build/old/project/src/components/Foo.astro')?.propagation,
			'self',
		);
		assert.equal(
			manifest.inlinedScripts.get(
				'/build/old/project/src/pages/index.astro?astro&type=script&index=0',
			),
			'code',
		);
	});

	it('prefers an exact key over a suffix match', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({
				entryModules: {
					'/src/components/Foo.jsx': 'exact.mjs',
					'/components/Foo.jsx': 'suffix.mjs',
				},
			}),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.entryModules['/src/components/Foo.jsx'], 'exact.mjs');
	});

	it('leaves non-path specifiers unresolved', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ entryModules: { '/src/components/Foo.jsx': 'foo.mjs' } }),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.entryModules['react'], undefined);
		assert.equal('react' in manifest.entryModules, false);
	});
});
