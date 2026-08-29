import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBuildInternals } from '../../../dist/core/build/internal.js';

describe('prerenderOnlyEntrySpecifiers', () => {
	it('is initialized as an empty set', () => {
		const internals = createBuildInternals();
		assert.ok(internals.prerenderOnlyEntrySpecifiers instanceof Set);
		assert.equal(internals.prerenderOnlyEntrySpecifiers.size, 0);
	});

	it('tracks specifiers added by the prerender environment', () => {
		const internals = createBuildInternals();
		internals.prerenderOnlyEntrySpecifiers.add('/project/src/lib/lazy.mjs');
		assert.ok(internals.prerenderOnlyEntrySpecifiers.has('/project/src/lib/lazy.mjs'));
	});

	it('removes specifier when also present in SSR or client environment', () => {
		const internals = createBuildInternals();
		// Simulates prerender writing first
		internals.prerenderOnlyEntrySpecifiers.add('/project/src/lib/shared.mjs');
		// Simulates SSR overwriting — the specifier is no longer prerender-only
		internals.prerenderOnlyEntrySpecifiers.delete('/project/src/lib/shared.mjs');
		assert.equal(internals.prerenderOnlyEntrySpecifiers.has('/project/src/lib/shared.mjs'), false);
	});

	it('retains specifiers not overwritten by later environments', () => {
		const internals = createBuildInternals();
		// Prerender adds two entries
		internals.prerenderOnlyEntrySpecifiers.add('/project/src/lib/lazy.mjs');
		internals.prerenderOnlyEntrySpecifiers.add('/project/src/lib/shared.mjs');
		// SSR overwrites only shared.mjs
		internals.prerenderOnlyEntrySpecifiers.delete('/project/src/lib/shared.mjs');
		// lazy.mjs remains prerender-only
		assert.ok(internals.prerenderOnlyEntrySpecifiers.has('/project/src/lib/lazy.mjs'));
		assert.equal(internals.prerenderOnlyEntrySpecifiers.has('/project/src/lib/shared.mjs'), false);
		assert.equal(internals.prerenderOnlyEntrySpecifiers.size, 1);
	});
});
