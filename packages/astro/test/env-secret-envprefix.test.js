import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('astro:env secret variables with envPrefix conflict', () => {
	it('throws an error when envPrefix matches a secret env schema variable', async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-env-secret-envprefix/',
		});

		try {
			await fixture.build();
			assert.fail('expected build to throw');
		} catch (error) {
			assert.equal(error instanceof Error, true);
			assert.equal(error.name, 'EnvPrefixConflictsWithSecret');
			assert.equal(error.message.includes('API_SECRET'), true);
		}
	});

	it('does not throw when envPrefix does not match any secret env schema variable', async () => {
		// Use the server-secret fixture which has secrets but default envPrefix (PUBLIC_)
		const fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			output: 'server',
			adapter: (await import('./test-adapter.js')).default({
				env: {
					KNOWN_SECRET: '123456',
					UNKNOWN_SECRET: 'abc',
				},
			}),
		});
		await fixture.build();
		assert.equal(true, true);
	});
});
