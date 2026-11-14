import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

// Per-path attribution is scoped to each render (AsyncLocalStorage), so the
// incremental cache stays enabled and correct when the build renders paths
// concurrently.
describe('experimental.incrementalBuild with build.concurrency > 1', () => {
	const root = new URL('./fixtures/incremental-build-concurrency/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let buildOutput = '';
	let manifest: any;

	function pathEntry(route: string, pathname: string) {
		return manifest.routes[route]?.paths?.[pathname];
	}

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			output: 'static',
			build: {
				concurrency: 4,
			},
			experimental: {
				incrementalBuild: true,
			},
		});

		// Capture build logs so the old cache-disable warning can be asserted absent.
		const captured: string[] = [];
		const stdoutWrite = process.stdout.write.bind(process.stdout);
		const stderrWrite = process.stderr.write.bind(process.stderr);
		const capture =
			(original: typeof stdoutWrite) =>
			(...args: Parameters<typeof stdoutWrite>) => {
				captured.push(String(args[0]));
				return original(...args);
			};
		process.stdout.write = capture(stdoutWrite) as typeof process.stdout.write;
		process.stderr.write = capture(stderrWrite) as typeof process.stderr.write;
		try {
			await fixture.build();
		} finally {
			process.stdout.write = stdoutWrite;
			process.stderr.write = stderrWrite;
		}
		buildOutput = captured.join('');
		manifest = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
	});

	it('keeps the cache enabled: manifest written, no disable warning', () => {
		assert.ok(fs.existsSync(cacheFile), 'the incremental manifest should be written');
		assert.ok(
			!buildOutput.includes('incremental build cache is disabled'),
			'the cache-disable warning should be gone',
		);
		assert.ok(fixture.pathExists('/item/a/index.html'));
		assert.ok(fixture.pathExists('/item/b/index.html'));
	});

	it('attributes content entries to the correct paths, shared entries included', () => {
		const one = pathEntry('src/pages/docs/[slug].astro', '/docs/one');
		const two = pathEntry('src/pages/docs/[slug].astro', '/docs/two');
		assert.deepEqual(Object.keys(one.contentHashes).sort(), [
			'src/content/docs/one.mdx',
			'src/content/docs/shared.mdx',
		]);
		assert.deepEqual(Object.keys(two.contentHashes).sort(), [
			'src/content/docs/shared.mdx',
			'src/content/docs/two.mdx',
		]);
		// The shared entry hashes identically on both paths.
		assert.equal(
			one.contentHashes['src/content/docs/shared.mdx'],
			two.contentHashes['src/content/docs/shared.mdx'],
		);
	});

	it('tracks a headings-only render(entry) call without rendering Content', () => {
		const entry = pathEntry('src/pages/headings/[slug].astro', '/headings/h');
		assert.deepEqual(Object.keys(entry.contentHashes), ['src/content/docs/headings.mdx']);
	});

	it('attributes an endpoint handler render(entry) to the endpoint path', () => {
		const paths = manifest.routes['src/pages/feed/[id].json.ts'].paths;
		const pathnames = Object.keys(paths);
		assert.equal(pathnames.length, 1);
		assert.deepEqual(Object.keys(paths[pathnames[0]].contentHashes), ['src/content/docs/feed.mdx']);
	});

	it('does not attribute a getStaticPaths-time render(entry) to any path', () => {
		for (const routeEntry of Object.values<any>(manifest.routes)) {
			for (const entry of Object.values<any>(routeEntry.paths)) {
				assert.ok(
					!Object.keys(entry.contentHashes ?? {}).includes('src/content/docs/gsp-only.mdx'),
				);
			}
		}
	});

	it('records no content or image tracking for paths that resolved none', () => {
		const item = pathEntry('src/pages/item/[slug].astro', '/item/a');
		assert.equal(item.contentHashes, undefined);
		assert.equal(item.staticImages, undefined);
	});

	it('attributes image transforms per path, dedup hits included', () => {
		const picA = pathEntry('src/pages/pic/[slug].astro', '/pic/a');
		const picB = pathEntry('src/pages/pic/[slug].astro', '/pic/b');
		assert.ok(picA.staticImages?.length > 0, '/pic/a should record its transforms');
		assert.ok(picB.staticImages?.length > 0, '/pic/b should record its transforms');

		// Both pages resolve the same width-100 transform. Whichever rendered second
		// hit the global dedup map, and the hit must still be attributed to it.
		const hashesA = new Set<string>(picA.staticImages.map((i: any) => i.hash));
		const hashesB = new Set<string>(picB.staticImages.map((i: any) => i.hash));
		for (const hash of hashesA) {
			assert.ok(hashesB.has(hash), `shared transform ${hash} should be attributed to /pic/b too`);
		}
		// /pic/b resolves an extra width-50 transform of its own.
		assert.ok(
			[...hashesB].some((hash) => !hashesA.has(hash)),
			'/pic/b should also record its non-shared transform',
		);
	});

	describe('second build (no changes)', () => {
		let picAImages: string[];
		let picBImages: string[];

		before(async () => {
			picAImages = pathEntry('src/pages/pic/[slug].astro', '/pic/a').staticImages.map(
				(i: any) => i.finalPath,
			);
			picBImages = pathEntry('src/pages/pic/[slug].astro', '/pic/b').staticImages.map(
				(i: any) => i.finalPath,
			);

			// A skipped path is restored from its cached copy (dist/ is emptied each
			// build). Plant sentinels there: a restore keeps them, a re-render would
			// overwrite them.
			fs.writeFileSync(
				new URL('node_modules/.astro/dist/docs/one/index.html', root),
				'cached docs one sentinel',
			);
			fs.writeFileSync(
				new URL('node_modules/.astro/dist/pic/a/index.html', root),
				'cached pic a sentinel',
			);
			await fixture.build();
		});

		it('skips every path and restores it from the cache', async () => {
			assert.equal(await fixture.readFile('/docs/one/index.html'), 'cached docs one sentinel');
			assert.equal(await fixture.readFile('/pic/a/index.html'), 'cached pic a sentinel');
		});

		it('still emits shared and non-shared optimized images for skipped pages', () => {
			for (const finalPath of [...picAImages, ...picBImages]) {
				assert.ok(
					fixture.pathExists(finalPath),
					`optimized image ${finalPath} should be replayed for the skipped page`,
				);
			}
		});
	});
});
