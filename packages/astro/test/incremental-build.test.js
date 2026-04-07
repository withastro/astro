import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { afterEach, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

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

/** @type {import('./test-utils.ts').Fixture[]} */
const fixtures = [];

afterEach(async () => {
	while (fixtures.length > 0) {
		const fixture = fixtures.pop();
		fixture?.resetAllFiles();
		await fs.rm(fixture.config.outDir, { recursive: true, force: true });
		await fs.rm(fixture.config.cacheDir, { recursive: true, force: true });
	}
});

async function createIncrementalFixture(suffix, root = './fixtures/incremental-build/') {
	const fixture = await loadFixture({
		root,
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
		const fixture = await createIncrementalFixture(
			'incremental-build-full-reuse',
			'./fixtures/incremental-build-static-only/',
		);
		await fixture.build();

		const output = await captureBuildOutput(() => fixture.build({ logLevel: 'info' }));

		assert.match(
			output,
			/Incremental build fully reused previous static build outputs and skipped bundling\./,
		);
	});

	it('keeps dynamic routes on the selective generation path even when inputs are unchanged', async () => {
		const fixture = await createIncrementalFixture('incremental-build-dynamic-no-full-reuse');
		await fixture.build();
		const redirectBefore = await getOutputStat(fixture, '/docs-start/index.html');
		const endpointBefore = await getOutputStat(fixture, '/feed.xml');

		const output = await captureBuildOutput(() => fixture.build({ logLevel: 'info' }));
		const redirectAfter = await getOutputStat(fixture, '/docs-start/index.html');
		const endpointAfter = await getOutputStat(fixture, '/feed.xml');

		assert.equal(
			output.includes(
				'Incremental build fully reused previous static build outputs and skipped bundling.',
			),
			false,
		);
		assert.match(
			output,
			/Incremental build skipped full static reuse: dynamic routes require fresh path generation/,
		);
		assert.match(output, /Incremental build reused \d+ static paths and rendered 0\./);
		assert.equal(redirectAfter.mtimeMs, redirectBefore.mtimeMs);
		assert.equal(endpointAfter.mtimeMs, endpointBefore.mtimeMs);
	});

	it('rebuilds a missing persisted page output on the next build', async () => {
		const fixture = await createIncrementalFixture('incremental-build-missing-output');
		await fixture.build();

		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		await fs.rm(new URL('./about/index.html', fixture.config.outDir), { force: true });

		await sleep(50);
		const output = await captureBuildOutput(() => fixture.build({ logLevel: 'info' }));
		const aboutAfter = await getOutputStat(fixture, '/about/index.html');

		assert.equal(
			output.includes(
				'Incremental build fully reused previous static build outputs and skipped bundling.',
			),
			false,
		);
		assert.match(output, /Incremental build reused \d+ static paths and rendered 1\./);
		assert.ok(aboutAfter.mtimeMs > aboutBefore.mtimeMs);
	});

	it('preserves reused pages while copying changed public assets', async () => {
		const fixture = await createIncrementalFixture('incremental-build-public-assets');
		await fixture.build();

		const indexBefore = await getOutputStat(fixture, '/index.html');

		await fixture.editFile('/public/logo.txt', 'updated logo');

		await sleep(50);
		const output = await captureBuildOutput(() => fixture.build({ logLevel: 'info' }));
		const indexAfter = await getOutputStat(fixture, '/index.html');

		assert.equal(
			output.includes(
				'Incremental build fully reused previous static build outputs and skipped bundling.',
			),
			false,
		);
		assert.match(output, /Incremental build reused \d+ static paths and rendered 0\./);
		assert.equal(indexAfter.mtimeMs, indexBefore.mtimeMs);
		assert.equal(await fixture.readFile('/logo.txt'), 'updated logo');
	});

	it('removes stale outputs when dynamic static paths are deleted', async () => {
		const fixture = await createIncrementalFixture('incremental-build-remove-path');
		await fixture.build();

		const aboutBefore = await getOutputStat(fixture, '/about/index.html');
		assert.equal(fixture.pathExists('/articles/article-020/index.html'), true);

		await fixture.editFile(
			'/src/data/articles.json',
			(contents) => `${JSON.stringify(JSON.parse(contents).slice(0, -1), null, '\t')}\n`,
		);

		await sleep(50);
		await fixture.build();

		const aboutAfter = await getOutputStat(fixture, '/about/index.html');
		assert.equal(fixture.pathExists('/articles/article-020/index.html'), false);
		assert.equal(fixture.pathExists('/articles/article-019/index.html'), true);
		assert.equal(aboutAfter.mtimeMs, aboutBefore.mtimeMs);
		assert.match(await fixture.readFile('/index.html'), /<p id="count">19<\/p>/);
	});
});
