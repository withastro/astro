import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deserializeManifest } from '../../../dist/core/app/manifest.js';
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

	it('keeps absolute file URLs from the prerender manifest', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ buildClientDir: 'file:///absolute/client/' }),
			undefined,
			'file:///deploy/dist/server/entry.mjs',
		);

		assert.equal(manifest.buildClientDir.href, 'file:///absolute/client/');
	});

	it('falls back to file:/// for relative paths when the server entry URL is opaque', () => {
		const manifest = deserializeManifest(
			createSerializedManifest(),
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

	it('resolves absolute paths without a server entry URL', () => {
		const manifest = deserializeManifest(
			createSerializedManifest({ buildClientDir: 'file:///absolute/client/' }),
		);

		assert.equal(manifest.buildClientDir.href, 'file:///absolute/client/');
		assert.equal(manifest.rootDir.href, 'file:///');
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
});

describe('toPortableManifest', () => {
	function createSettings(outDir = new URL('file:///project/dist/')) {
		return {
			config: {
				root: new URL('file:///project/'),
				cacheDir: new URL('file:///project/node_modules/.astro/'),
				outDir,
				srcDir: new URL('file:///project/src/'),
				publicDir: new URL('file:///project/public/'),
				build: {
					server: new URL('file:///project/dist/server/'),
					client: new URL('file:///project/dist/client/'),
				},
			},
		} as never;
	}

	it('serializes a directory equal to the server directory as ./', () => {
		const settings = createSettings(new URL('file:///project/dist/server/'));
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

	it('resolves the serialized server directory back to the server entry directory', () => {
		const settings = createSettings(new URL('file:///project/dist/server/'));
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
	// Only `config.root` is read, so a minimal settings object is enough.
	const settings = { config: { root: new URL('file:///project/') } } as never;

	it('relativizes keys inside the project root', () => {
		const manifest = createSerializedManifest({
			componentMetadata: [
				['/project/src/pages/index.astro', { propagation: 'none', containsHead: false }],
			],
			inlinedScripts: [['/project/src/pages/index.astro?astro&type=script&index=0', 'code']],
			entryModules: { '/project/src/components/Foo.astro': 'chunk.mjs' },
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
});
