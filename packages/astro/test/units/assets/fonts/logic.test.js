// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveFamily } from '../../../../dist/assets/fonts/logic/resolve-families.js';
import { extractUnifontProviders } from '../../../../dist/assets/fonts/logic/extract-unifont-providers.js';
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

	describe('extractUnifontProviders()', () => {
		const createProvider = (/** @type {string} */ name) => () =>
			Object.assign(() => undefined, { _name: name });

		/** @param {Array<import('../../../../dist/assets/fonts/types.js').ResolvedFontFamily>} families */
		function createFixture(families) {
			const result = extractUnifontProviders({
				families,
				hasher: fakeHasher,
			});
			return {
				/**
				 * @param {number} length
				 */
				assertProvidersLength: (length) => {
					assert.equal(result.providers.length, length);
				},
				/**
				 * @param {Array<string>} names
				 */
				assertProvidersNames: (names) => {
					assert.deepStrictEqual(
						result.families.map((f) =>
							typeof f.provider === 'string' ? f.provider : f.provider.name,
						),
						names,
					);
				},
			};
		}

		it('skips local fonts', () => {
			const fixture = createFixture([
				{
					name: 'Custom',
					nameWithHash: 'Custom-xxx',
					cssVariable: '--custom',
					provider: 'local',
					variants: [
						{
							src: [{ url: 'a' }],
							weight: '400',
							style: 'normal',
						},
					],
				},
			]);
			fixture.assertProvidersLength(0);
			fixture.assertProvidersNames(['local']);
		});

		it('appends a hash to the provider name', () => {
			const fixture = createFixture([
				{
					name: 'Custom',
					nameWithHash: 'Custom-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames(['test-{"name":"test"}']);
		});

		it('deduplicates providers with no config', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames(['test-{"name":"test"}', 'test-{"name":"test"}']);
		});

		it('deduplicates providers with the same config', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: { x: 'y' },
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: { x: 'y' },
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames([
				'test-{"name":"test","x":"y"}',
				'test-{"name":"test","x":"y"}',
			]);
		});

		it('does not deduplicate providers with different configs', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: {
							x: 'foo',
						},
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: {
							x: 'bar',
						},
					},
				},
			]);
			fixture.assertProvidersLength(2);
			fixture.assertProvidersNames([
				'test-{"name":"test","x":"foo"}',
				'test-{"name":"test","x":"bar"}',
			]);
		});
	});
});
