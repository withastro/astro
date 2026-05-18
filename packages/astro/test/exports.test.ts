import assert from 'node:assert/strict';
import { it } from 'node:test';

it('"exports" and "publishConfig.exports" should be the same except for internal API', async () => {
	const { default: pkgJson } = await import('../package.json', { with: { type: 'json' } });
	const exports: Record<string, unknown> = pkgJson.exports;
	const publishConfigExports: Record<string, unknown> = pkgJson.publishConfig.exports;
	const internal = Object.keys(exports).filter((key) => key.startsWith('./_internal/'));
	for (const key of internal) {
		delete exports[key];
	}
	assert.deepEqual(exports, publishConfigExports);
});
