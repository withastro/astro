import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';
import { fontProviders } from 'astro/config';

describe('incremental build + fonts: dependency hash stability', () => {
	const root = new URL('./fixtures/incremental-build-fonts/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let firstHash: string;
	let secondHash: string;

	before(async () => {
		// Clean up
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheFile, { force: true });

		const fixture = await loadFixture({
			root,
			experimental: {
				incrementalBuild: true,
			},
			fonts: [
				{
					name: 'Roboto',
					cssVariable: '--font-roboto',
					provider: fontProviders.local(),
					options: {
						variants: [
							{
								weight: 400,
								style: 'normal',
								src: ['./src/fonts/roboto-normal-400.woff2'],
							},
						],
					} as any,
					optimizedFallbacks: false,
				},
			],
		});

		// First build
		await fixture.build();
		const cache1 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const route1 = cache1.routes['src/pages/[slug].astro'];
		firstHash = route1.dependencyHash;

		// Second build (no changes)
		await fixture.build();
		const cache2 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const route2 = cache2.routes['src/pages/[slug].astro'];
		secondHash = route2.dependencyHash;
	});

	it('should produce the same dependency hash across builds', () => {
		assert.equal(
			firstHash,
			secondHash,
			`Dependency hash changed between builds!\nFirst:  ${firstHash}\nSecond: ${secondHash}\nThis means the font virtual module is embedding ephemeral data (like a server port).`,
		);
	});
});
