import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild content entry dependencies', () => {
	const root = new URL('./fixtures/incremental-build-content/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const componentFile = new URL('src/components/One.astro', root);
	const ROUTE = 'src/pages/[slug].astro';
	const ONE_ENTRY = 'src/content/docs/one.mdx';

	function contentHashes(pathname: string): Record<string, string> | undefined {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		return cache.routes[ROUTE]?.paths[pathname]?.contentHashes;
	}

	function renderedMarker(): string {
		return fs.readFileSync(new URL('dist/one/index.html', root), 'utf-8');
	}

	async function build(): Promise<void> {
		const fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
		});
		await fixture.build();
	}

	let hashesOneBefore: Record<string, string> | undefined;
	let hashesTwoBefore: Record<string, string> | undefined;
	let hashesOneAfter: Record<string, string> | undefined;
	let hashesTwoAfter: Record<string, string> | undefined;
	let markerAfter: string;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fs.writeFileSync(componentFile, '<div>COMPONENT_MARKER_V1</div>\n');

		await build();
		hashesOneBefore = contentHashes('/one');
		hashesTwoBefore = contentHashes('/two');

		// Change a component imported by one.mdx. Its render module sits behind a
		// content-data bridge, so only per-entry content hashing can catch this.
		fs.writeFileSync(componentFile, '<div>COMPONENT_MARKER_V2</div>\n');
		await build();
		hashesOneAfter = contentHashes('/one');
		hashesTwoAfter = contentHashes('/two');
		markerAfter = renderedMarker();

		fs.writeFileSync(componentFile, '<div>COMPONENT_MARKER_V1</div>\n');
	});

	it('tracks the rendered content entry for a route', () => {
		assert.ok(hashesOneBefore?.[ONE_ENTRY], 'one.mdx should be tracked for /one');
	});

	it('changes the content hash when an imported component changes', () => {
		assert.notEqual(hashesOneBefore?.[ONE_ENTRY], hashesOneAfter?.[ONE_ENTRY]);
	});

	it('does not change the content hash of an unrelated entry', () => {
		assert.deepEqual(hashesTwoAfter, hashesTwoBefore);
	});

	it('re-renders the affected page with the updated component output', () => {
		assert.match(markerAfter, /COMPONENT_MARKER_V2/);
	});
});
