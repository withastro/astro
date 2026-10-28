import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

// A page that produced output on one build but produces none on a later build
// must not leave a stale cache copy behind that a subsequent skip can restore.
describe('experimental.incrementalBuild no-output transition', () => {
	const root = new URL('./fixtures/incremental-build-no-output/', import.meta.url);
	const page = new URL('src/pages/toggle/[slug].astro', root);
	const cachedCopy = new URL('node_modules/.astro/dist/toggle/a/index.html', root);
	let fixture: Fixture;
	let original: string;

	// Same route, but a bumped cacheKey (forces a re-render instead of a skip) and
	// an early return that yields no output file.
	const noOutput = `---
export async function getStaticPaths() {
	return [{ params: { slug: 'a' }, props: {}, cacheKey: 'v2' }];
}
return new Response(null, { status: 200 });
---
`;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		original = fs.readFileSync(page, 'utf-8');
		fixture = await loadFixture({
			root,
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
		});

		// Build 1: the page emits output and its copy is cached.
		await fixture.build();
	});

	after(() => {
		fs.writeFileSync(page, original);
	});

	it('does not resurrect output from a build where the page stopped emitting', async () => {
		assert.ok(fixture.pathExists('/toggle/a/index.html'), 'first build should emit the page');
		assert.ok(fs.existsSync(cachedCopy), 'first build should cache a copy');

		// Build 2: the page now renders no output (and a changed cacheKey forces a
		// re-render rather than a skip).
		fs.writeFileSync(page, noOutput);
		await fixture.build();

		assert.ok(
			!fs.existsSync(cachedCopy),
			'the stale cache copy should be pruned once the page stops emitting',
		);

		// Build 3: nothing changed since build 2. A recorded no-output path would be
		// skippable here and restore the stale copy; it must re-render to nothing.
		await fixture.build();

		assert.ok(
			!fixture.pathExists('/toggle/a/index.html'),
			'output should not be resurrected from the cache',
		);
	});
});
