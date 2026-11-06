import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { purgeTags } from '../../dist/cache/purge.js';

type PurgeResult = { success: boolean; errors: { code: number; message: string }[] };

function createCache(result: PurgeResult) {
	const calls: { tags?: string[] }[] = [];
	const cache = {
		async purge(options: { tags?: string[] }) {
			calls.push(options);
			return result;
		},
	};
	return { cache, calls };
}

describe('purgeTags', () => {
	it('purges the tags and resolves when Cloudflare accepts the purge', async () => {
		const { cache, calls } = createCache({ success: true, errors: [] });

		await purgeTags(cache, ['posts', 'astro-path:/blog']);

		assert.deepEqual(calls, [{ tags: ['posts', 'astro-path:/blog'] }]);
	});

	it('rejects with the returned errors when Cloudflare refuses the purge', async () => {
		const errors = [{ code: 429, message: 'Too many purge requests' }];
		const { cache } = createCache({ success: false, errors });

		await assert.rejects(purgeTags(cache, ['posts']), (error: Error) => {
			assert.match(error.message, /429 Too many purge requests/);
			assert.deepEqual(error.cause, errors);
			return true;
		});
	});
});
