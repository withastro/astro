import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getAmbientManifest,
	setAmbientManifest,
	tryGetAmbientManifest,
} from '../../../dist/core/manifest/ambient.js';
import { createManifest } from '../app/test-helpers.ts';

// In plain Node the '#astro-internal/ambient-manifest' subpath resolves to the
// ambient-source stub (manifest: undefined), so only an explicit registration
// can provide an ambient manifest here.
describe('ambient manifest', () => {
	it('getAmbientManifest throws when no manifest is available', () => {
		// The registration is process-global and other test files (fetch/hono
		// composable-API suites) register manifests in the same process, so
		// clear it explicitly before asserting the unregistered behavior.
		setAmbientManifest(undefined);
		assert.throws(
			() => getAmbientManifest(),
			(error: unknown) => {
				assert.ok(error instanceof Error);
				assert.equal(error.name, 'NoManifestAvailableError');
				assert.match(error.message, /outside of an Astro server/);
				return true;
			},
		);
	});

	it('tryGetAmbientManifest returns undefined when no manifest is available', () => {
		setAmbientManifest(undefined);
		assert.equal(tryGetAmbientManifest(), undefined);
	});

	it('returns the registered manifest after setAmbientManifest', () => {
		const manifest = createManifest();
		try {
			setAmbientManifest(manifest);
			assert.equal(getAmbientManifest(), manifest);
			assert.equal(tryGetAmbientManifest(), manifest);
		} finally {
			setAmbientManifest(undefined);
		}
	});

	it('setAmbientManifest(undefined) clears the registration', () => {
		const manifest = createManifest();
		setAmbientManifest(manifest);
		setAmbientManifest(undefined);
		assert.equal(tryGetAmbientManifest(), undefined);
		assert.throws(() => getAmbientManifest());
	});

	it('last registration wins', () => {
		const first = createManifest();
		const second = createManifest();
		try {
			setAmbientManifest(first);
			setAmbientManifest(second);
			assert.equal(getAmbientManifest(), second);
		} finally {
			setAmbientManifest(undefined);
		}
	});
});
