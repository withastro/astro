import assert from 'node:assert/strict';
import { it } from 'node:test';

it('"exports" and "publishConfig.exports" should be the same except for internal API', async () => {
	const { default: pkgJson } = await import('../package.json', { with: { type: 'json' } });
	const internal = Object.keys(pkgJson.exports).filter((key) => key.startsWith('./_internal/'));
	for (const key of internal) {
		delete pkgJson.exports[key];
	}
	assert.deepEqual(pkgJson.exports, pkgJson.publishConfig.exports);
});
