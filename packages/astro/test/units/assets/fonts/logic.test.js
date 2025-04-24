// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveFamily } from '../../../../dist/assets/fonts/logic/resolve-families.js';
import { fakeHasher } from './utils.js';

describe('astro fonts logic', () => {
	describe('resolveFamily()', () => {
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
					resolve: async () => ({}),
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
					resolve: async () => ({}),
				},
			});
			assert.equal(family.name, 'Foo bar');
			assert.equal(family.nameWithHash, 'Foo bar-xxx');
		});

		it('resolves local variant correctly', async () => {
			const family = await resolveFamily({
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
				hasher: fakeHasher,
				localProviderUrlResolver: {
					resolve: (url) => url + url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			if (family.provider === 'local') {
				assert.deepStrictEqual(
					family.variants.map((variant) => variant.src),
					[[{ url: '//', tech: undefined }]],
				);
			} else {
				assert.fail('Should be a local provider');
			}
		});

		it('resolves remote providers', async () => {
			const provider = () => {};
			const family = await resolveFamily({
				family: {
					provider: {
						entrypoint: '',
					},
					name: 'Test',
					cssVariable: '--test',
				},
				hasher: fakeHasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({
						provider,
					}),
				},
			});
			if (family.provider === 'local') {
				assert.fail('Should be a remote provider');
			} else {
				assert.deepStrictEqual(family.provider, { provider });
			}
		});

		it('dedupes properly', async () => {
			let family = await resolveFamily({
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
					fallbacks: ['foo', 'bar', 'foo'],
				},
				hasher: fakeHasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			assert.deepStrictEqual(family.fallbacks, ['foo', 'bar']);

			family = await resolveFamily({
				family: {
					provider: { entrypoint: '' },
					name: '"Foo bar"',
					cssVariable: '--test',
					weights: [400, '400', '500', 'bold'],
					styles: ['normal', 'normal', 'italic'],
					subsets: ['latin', 'latin'],
					fallbacks: ['foo', 'bar', 'foo'],
					unicodeRange: ['abc', 'def', 'abc'],
				},
				hasher: fakeHasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});

			if (family.provider === 'local') {
				assert.fail('Should be a remote provider');
			} else {
				assert.deepStrictEqual(family.weights, ['400', '500', 'bold']);
				assert.deepStrictEqual(family.styles, ['normal', 'italic']);
				assert.deepStrictEqual(family.subsets, ['latin']);
				assert.deepStrictEqual(family.fallbacks, ['foo', 'bar']);
				assert.deepStrictEqual(family.unicodeRange, ['abc', 'def']);
			}
		});
	});
});
