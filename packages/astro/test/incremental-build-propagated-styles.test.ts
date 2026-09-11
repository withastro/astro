import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild propagated style dependencies', () => {
	const root = new URL('./fixtures/incremental-build-propagated-styles/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const tokensFile = new URL('src/styles/_tokens.scss', root);
	const ROUTE = 'src/pages/[slug].astro';
	const ONE_ENTRY = 'src/content/docs/one.mdx';

	function contentHashes(pathname: string): Record<string, string> | undefined {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		return cache.routes[ROUTE]?.paths[pathname]?.contentHashes;
	}

	async function build(): Promise<void> {
		const fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
		});
		await fixture.build();
	}

	function renderedStyles(): string {
		return fs.readFileSync(new URL('dist/one/index.html', root), 'utf-8');
	}

	let oneBefore: Record<string, string> | undefined;
	let twoBefore: Record<string, string> | undefined;
	let oneAfter: Record<string, string> | undefined;
	let twoAfter: Record<string, string> | undefined;
	let htmlAfter = '';

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fs.writeFileSync(tokensFile, '$brand: #ff0000;\n');

		await build();
		oneBefore = contentHashes('/one');
		twoBefore = contentHashes('/two');

		fs.writeFileSync(tokensFile, '$brand: #0000ff;\n');
		await build();
		oneAfter = contentHashes('/one');
		twoAfter = contentHashes('/two');
		htmlAfter = renderedStyles();

		fs.writeFileSync(tokensFile, '$brand: #ff0000;\n');
	});

	after(() => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
	});

	it('tracks the rendered content entry for a route', () => {
		assert.ok(oneBefore?.[ONE_ENTRY], 'one.mdx should be tracked for /one');
	});

	it('changes the content hash when a propagated stylesheet changes', () => {
		assert.notEqual(oneBefore?.[ONE_ENTRY], oneAfter?.[ONE_ENTRY]);
	});

	it('does not change the content hash of an entry without propagated styles', () => {
		assert.deepEqual(twoAfter, twoBefore);
	});

	it('re-renders the affected page with the updated CSS', () => {
		assert.match(htmlAfter, /#00f|#0000ff|blue/i);
	});
});
