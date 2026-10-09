import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAsyncManifestMemo, createManifestMemo } from '../../../dist/core/manifest/memo.js';
import type { SSRManifest } from '../../../dist/core/app/types.js';
import { createManifest } from '../app/test-helpers.ts';

describe('createManifestMemo', () => {
	it('derives once per manifest and caches the value', () => {
		let calls = 0;
		const memo = createManifestMemo((manifest: SSRManifest) => {
			calls++;
			return { for: manifest.base };
		});
		const manifest = createManifest({ base: '/blog' });

		const first = memo.get(manifest);
		const second = memo.get(manifest);
		assert.equal(calls, 1);
		assert.equal(first, second);
		assert.equal(first.for, '/blog');
	});

	it('keys entries by manifest object', () => {
		let calls = 0;
		const memo = createManifestMemo(() => ++calls);
		const a = createManifest();
		const b = createManifest();

		assert.equal(memo.get(a), 1);
		assert.equal(memo.get(b), 2);
		assert.equal(memo.get(a), 1);
	});

	it('caches derivations that produce undefined', () => {
		let calls = 0;
		const memo = createManifestMemo(() => {
			calls++;
			return undefined;
		});
		const manifest = createManifest();

		assert.equal(memo.get(manifest), undefined);
		assert.equal(memo.get(manifest), undefined);
		assert.equal(calls, 1);
	});

	it('set() replaces the stored value without re-deriving', () => {
		let calls = 0;
		const memo = createManifestMemo(() => {
			calls++;
			return 'derived';
		});
		const manifest = createManifest();

		assert.equal(memo.get(manifest), 'derived');
		memo.set(manifest, 'replaced');
		assert.equal(memo.get(manifest), 'replaced');
		assert.equal(calls, 1);
	});

	it('invalidate() forces a re-derive on the next get', () => {
		let calls = 0;
		const memo = createManifestMemo(() => ++calls);
		const manifest = createManifest();

		assert.equal(memo.get(manifest), 1);
		memo.invalidate(manifest);
		assert.equal(memo.get(manifest), 2);
	});
});

describe('createAsyncManifestMemo', () => {
	it('is single-flight: concurrent callers share one derivation', async () => {
		let calls = 0;
		let release!: (value: string) => void;
		const memo = createAsyncManifestMemo(() => {
			calls++;
			return new Promise<string>((resolve) => {
				release = resolve;
			});
		});
		const manifest = createManifest();

		const first = memo.get(manifest);
		const second = memo.get(manifest);
		assert.equal(calls, 1);
		assert.equal(first, second);

		release('resolved');
		assert.equal(await first, 'resolved');
		// Still cached after settling.
		assert.equal(await memo.get(manifest), 'resolved');
		assert.equal(calls, 1);
	});

	it('deletes the entry on rejection so the next call retries', async () => {
		let calls = 0;
		const memo = createAsyncManifestMemo(async () => {
			calls++;
			if (calls === 1) {
				throw new Error('load failed');
			}
			return 'recovered';
		});
		const manifest = createManifest();

		await assert.rejects(memo.get(manifest), { message: 'load failed' });
		assert.equal(await memo.get(manifest), 'recovered');
		assert.equal(calls, 2);
		// The successful value stays cached.
		assert.equal(await memo.get(manifest), 'recovered');
		assert.equal(calls, 2);
	});

	it('invalidate() forces a re-derive on the next get', async () => {
		let calls = 0;
		const memo = createAsyncManifestMemo(async () => ++calls);
		const manifest = createManifest();

		assert.equal(await memo.get(manifest), 1);
		memo.invalidate(manifest);
		assert.equal(await memo.get(manifest), 2);
	});
});
