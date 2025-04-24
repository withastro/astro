// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveFamily } from '../../../../dist/assets/fonts/logic/resolve-families.js';
import { fakeHasher } from './utils.js';

describe('astro fonts logic', () => {
	describe('resolveFamily()', () => {
		// TODO: check local provider
		// TODO: check deduping
		// TODO: check remote provider
		it('removes quotes correctly', async () => {
			const hasher = { ...fakeHasher, hashObject: () => 'xxx' };
			let family = await resolveFamily({
				family: {
					provider: 'local',
					name: 'Test',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
				},
				hasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({
						provider: () => {},
					}),
				},
			});
			assert.equal(family.name, 'Test');
			assert.equal(family.nameWithHash, 'Test-xxx');

			family = await resolveFamily({
				family: {
					provider: 'local',
					name: '"Foo bar"',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
				},
				hasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({
						provider: () => {},
					}),
				},
			});
			assert.equal(family.name, 'Foo bar');
			assert.equal(family.nameWithHash, 'Foo bar-xxx');
		});
	});
});
