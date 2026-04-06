import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { afterEach, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

async function getOutputStat(fixture, filePath) {
	return fs.stat(new URL(filePath.replace(/^\//, ''), fixture.config.outDir));
}

async function sleep(ms) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

function getFirstCssHref(html) {
	return html.match(/href="([^"]+\.css)"/)?.[1];
}

async function captureBuildOutput(runBuild) {
	const output = [];
	const stdoutWrite = process.stdout.write.bind(process.stdout);
	const stderrWrite = process.stderr.write.bind(process.stderr);
	process.stdout.write = (chunk) => {
		output.push(String(chunk));
		return true;
	};
	process.stderr.write = (chunk) => {
		output.push(String(chunk));
		return true;
	};
	try {
		await runBuild();
	} finally {
		process.stdout.write = stdoutWrite;
		process.stderr.write = stderrWrite;
	}
	return output.join('');
}

/** @type {import('./test-utils.js').Fixture[]} */
const fixtures = [];

afterEach(async () => {
	while (fixtures.length > 0) {
		const fixture = fixtures.pop();
		fixture?.resetAllFiles();
		await fs.rm(fixture.config.outDir, { recursive: true, force: true });
		await fs.rm(fixture.config.cacheDir, { recursive: true, force: true });
	}
});

async function createIncrementalFixture(suffix) {
	const fixture = await loadFixture({
		root: './fixtures/incremental-build/',
		outDir: `./dist/${suffix}/`,
		cacheDir: `./node_modules/.astro-${suffix}/`,
	});
	fixtures.push(fixture);
	return fixture;
}

describe('Incremental build', () => {
	it('reuses unchanged static page outputs on the next build', async () => {
		const fixture = await createIncrementalFixture('incremental-build-reuse');
		await fixture.build();

		const indexBefore = await getOutputStat(fixture, '/index.html');
		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		const articleBefore = await getOutputStat(fixture, '/articles/article-001/index.html');

		await sleep(50);
		await fixture.build();

		const indexAfter = await getOutputStat(fixture, '/index.html');
		const aboutAfter = await getOutputStat(fixture, '/about/index.html');
		const articleAfter = await getOutputStat(fixture, '/articles/article-001/index.html');

		assert.equal(indexAfter.mtimeMs, indexBefore.mtimeMs);
		assert.equal(aboutAfter.mtimeMs, aboutBefore.mtimeMs);
		assert.equal(articleAfter.mtimeMs, articleBefore.mtimeMs);
	});

	it('rerenders only the changed static page when an unrelated page updates', async () => {
		const fixture = await createIncrementalFixture('incremental-build-static-page');
		await fixture.build();

		const indexBefore = await getOutputStat(fixture, '/index.html');
		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		const articleBefore = await getOutputStat(fixture, '/articles/article-001/index.html');

		await fixture.editFile('/src/pages/index.astro', (contents) =>
			contents.replace('All articles', 'Updated article list'),
		);

		await sleep(50);
		await fixture.build();

		const indexAfter = await getOutputStat(fixture, '/index.html');
		const aboutAfter = await getOutputStat(fixture, '/about/index.html');
		const articleAfter = await getOutputStat(fixture, '/articles/article-001/index.html');

		assert.ok(indexAfter.mtimeMs > indexBefore.mtimeMs);
		assert.equal(aboutAfter.mtimeMs, aboutBefore.mtimeMs);
		assert.equal(articleAfter.mtimeMs, articleBefore.mtimeMs);
		assert.match(await fixture.readFile('/index.html'), /Updated article list/);
	});

	it('rerenders the data-driven route family when the article dataset changes', async () => {
		const fixture = await createIncrementalFixture('incremental-build-data');
		await fixture.build();

		const indexBefore = await getOutputStat(fixture, '/index.html');
		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		const articleOneBefore = await getOutputStat(fixture, '/articles/article-001/index.html');
		const articleTwoBefore = await getOutputStat(fixture, '/articles/article-002/index.html');

		await fixture.editFile('/src/data/articles.json', (contents) =>
			contents.replace('"Article 001"', '"Article 001 updated"'),
		);

		await sleep(50);
		await fixture.build();

		const indexAfter = await getOutputStat(fixture, '/index.html');
		const aboutAfter = await getOutputStat(fixture, '/about/index.html');
		const articleOneAfter = await getOutputStat(fixture, '/articles/article-001/index.html');
		const articleTwoAfter = await getOutputStat(fixture, '/articles/article-002/index.html');

		assert.ok(indexAfter.mtimeMs > indexBefore.mtimeMs);
		assert.equal(aboutAfter.mtimeMs, aboutBefore.mtimeMs);
		assert.ok(articleOneAfter.mtimeMs > articleOneBefore.mtimeMs);
		assert.ok(articleTwoAfter.mtimeMs > articleTwoBefore.mtimeMs);
		assert.match(await fixture.readFile('/articles/article-001/index.html'), /Article 001 updated/);
	});

	it('rerenders reused HTML when the emitted CSS asset fingerprint changes', async () => {
		const fixture = await createIncrementalFixture('incremental-build-css-assets');
		await fixture.build();

		const indexBefore = await getOutputStat(fixture, '/index.html');
		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		const indexHtmlBefore = await fixture.readFile('/index.html');
		const cssHrefBefore = getFirstCssHref(indexHtmlBefore);

		assert.ok(cssHrefBefore);

		await fixture.editFile('/src/styles/index.css', (contents) =>
			contents.replace('rebeccapurple', 'mediumseagreen'),
		);

		await sleep(50);
		await fixture.build();

		const indexAfter = await getOutputStat(fixture, '/index.html');
		const aboutAfter = await getOutputStat(fixture, '/about/index.html');
		const indexHtmlAfter = await fixture.readFile('/index.html');
		const cssHrefAfter = getFirstCssHref(indexHtmlAfter);

		assert.ok(indexAfter.mtimeMs > indexBefore.mtimeMs);
		assert.equal(aboutAfter.mtimeMs, aboutBefore.mtimeMs);
		assert.ok(cssHrefAfter);
		assert.notEqual(cssHrefAfter, cssHrefBefore);
		assert.equal(indexHtmlAfter.includes(cssHrefBefore), false);
		assert.equal(indexHtmlAfter.includes(cssHrefAfter), true);
	});

	it('skips bundling entirely when the static build inputs are unchanged', async () => {
		const fixture = await createIncrementalFixture('incremental-build-full-reuse');
		await fixture.build();

		const output = await captureBuildOutput(() => fixture.build({ logLevel: 'info' }));

		assert.match(
			output,
			/Incremental build fully reused previous static build outputs and skipped bundling\./,
		);
	});
});
