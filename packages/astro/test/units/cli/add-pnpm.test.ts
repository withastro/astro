import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPnpmAllowBuildFlags } from '../../../dist/cli/add/pnpm.js';

describe('astro add with pnpm', () => {
	it('approves workerd builds when adding cloudflare with pnpm v11+', async () => {
		assert.deepEqual(await getPnpmAllowBuildFlags(['cloudflare'], async () => '12.10.1'), [
			'--allow-build=workerd',
		]);
		assert.deepEqual(await getPnpmAllowBuildFlags(['react', 'cloudflare'], async () => '11.0.0'), [
			'--allow-build=workerd',
		]);
	});

	it('does not pass --allow-build to pnpm versions before v11 or unknown versions', async () => {
		assert.deepEqual(await getPnpmAllowBuildFlags(['cloudflare'], async () => '10.34.6'), []);
		assert.deepEqual(await getPnpmAllowBuildFlags(['cloudflare'], async () => '9.15.9'), []);
		assert.deepEqual(await getPnpmAllowBuildFlags(['cloudflare'], async () => undefined), []);
	});

	it('does not look up the pnpm version for integrations without build dependencies', async () => {
		const flags = await getPnpmAllowBuildFlags(['react'], async () => {
			throw new Error('should not be called');
		});
		assert.deepEqual(flags, []);
	});
});
