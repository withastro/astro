import * as assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

/**
 * Resolves once the dev server's watcher reports the given file, so a test can
 * wait for the write to be observed instead of guessing a duration. Comparisons
 * use forward slashes on both sides: the watcher may report OS-native paths.
 */
function waitForWatcherEvent(watcher: DevServer['watcher'], file: URL): Promise<void> {
	const target = fileURLToPath(file).replaceAll('\\', '/');
	return new Promise<void>((resolve) => {
		const onEvent = (changed: string) => {
			if (changed.replaceAll('\\', '/') !== target) return;
			watcher.off('add', onEvent);
			watcher.off('change', onEvent);
			resolve();
		};
		watcher.on('add', onEvent);
		watcher.on('change', onEvent);
	});
}

// Regression test for https://github.com/withastro/astro/issues/17995
//
// `virtual:astro:component-metadata` is imported by the dev app entrypoint, so
// invalidating it invalidates that entire import chain and the module runner
// re-evaluates the server graph on the next request. The plugin invalidated the
// module from its own `transform` hook, so evaluating it scheduled the next
// evaluation and every request from then on paid for a full re-evaluation.
describe('Head metadata invalidation in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	async function transformInvalidations() {
		const res = await fixture.fetch('/__transform-invalidations');
		return Number(await res.text());
	}

	async function watcherInvalidations() {
		const res = await fixture.fetch('/__watcher-invalidations');
		return Number(await res.text());
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-metadata-invalidation/',
		});
		devServer = await fixture.startDevServer();
		// Warm the graph: the first requests legitimately invalidate while the
		// page and its layout are compiled for the first time.
		await fixture.fetch('/');
		await fixture.fetch('/');
	});

	after(async () => {
		await devServer?.stop();
	});

	it('stops invalidating the metadata module once the graph is warm', async () => {
		const baseline = await transformInvalidations();
		await fixture.fetch('/');
		await fixture.fetch('/');
		await fixture.fetch('/');
		assert.equal(await transformInvalidations(), baseline);
	});

	// Regression test for https://github.com/withastro/astro/issues/18065
	//
	// The Cloudflare dev runtime rewrites files under `.wrangler/state` while a
	// request is served, and the dev server watches the project root. Those files
	// are not part of any module graph, so they cannot have changed component
	// metadata; invalidating the metadata module for them invalidated the dev app
	// entrypoint that imports it, making the runner re-evaluate the server graph
	// on the next request.
	it('ignores writes to files outside the module graph', { timeout: 20_000 }, async () => {
		await fixture.fetch('/');
		const baseline = await watcherInvalidations();

		const unrelated = new URL('.wrangler/state/repro-unrelated-write', fixture.config.root);
		await mkdir(new URL('./', unrelated), { recursive: true });
		try {
			// The plugin's listener runs before this one during the same dispatch, so
			// the count is settled by the time this resolves.
			const watched = waitForWatcherEvent(devServer.watcher, unrelated);
			await writeFile(unrelated, 'unrelated');
			await watched;

			assert.equal(await watcherInvalidations(), baseline);
		} finally {
			await rm(unrelated, { force: true });
		}
	});

	it('refreshes propagated head metadata after a layout adds a head', async () => {
		await fixture.editFile('./src/layouts/Layout.astro', (content) =>
			content
				.replace(
					'const { title } = Astro.props;',
					"import ThemeIcons from '../components/ThemeIcons.astro';\nconst { title } = Astro.props;",
				)
				.replace(
					'\t<!-- head-placeholder -->',
					`\t<head>
		<meta charset="utf-8" />
		<title>{title}</title>
		<ThemeIcons />
	</head>`,
				),
		);

		const html = await (await fixture.fetch('/')).text();
		const templateOpen = html.indexOf('<template id="theme-icons">');
		const templateClose = html.indexOf('</template>');
		assert.ok(templateOpen !== -1 && templateClose > templateOpen);

		assert.match(html, /<style data-vite-dev-id=/);
		assert.doesNotMatch(
			html.slice(templateOpen, templateClose),
			/<style data-vite-dev-id=/,
			'fresh containsHead metadata must keep injected styles outside an inert template',
		);
	});
});
