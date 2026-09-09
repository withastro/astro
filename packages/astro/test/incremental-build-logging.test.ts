import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { AstroLogger, type AstroLoggerMessage } from '../dist/core/logger/core.js';
import { type Fixture, loadFixture } from './test-utils.ts';
import createTestPrerenderer from './test-prerenderer.ts';
import testAdapter from './test-adapter.ts';

const root = new URL('./fixtures/incremental-build-logging/', import.meta.url);
const cacheDir = new URL('node_modules/.astro/', root);
const cacheFile = new URL('incremental-build.json', cacheDir);

// Two valid 32-byte base64 keys so the server-island encryption key can be
// rotated between builds without minting a fresh key every build.
const FIXED_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';
const ROTATED_KEY = '7L9SkkvbK2nwAuX3pzmGk2ffANCIbINvjcjkkS9IB2E=';

// Total paths: blog x4, sidebar x2, docs x2, index x1, plain x1, island x1.
const TOTAL_PATHS = 11;

function stripAnsi(text: string): string {
	return text.replace(/\u001B\[\d+m/g, '');
}

/** Replace volatile durations so exact summary lines stay stable. */
function normalizeTime(text: string): string {
	return text.replace(/\+\d+(?:\.\d+)?m?s/g, '+<time>').replace(/<1ms/g, '<time>');
}

describe('experimental.incrementalBuild logging output', () => {
	let fixture: Fixture;

	async function build(extraInlineConfig: Record<string, any> = {}): Promise<string> {
		// A fresh array per build: stale loggers from earlier builds keep writing
		// into their own closure, so captured output is never polluted by a
		// previous build's late messages (e.g. prerenderer teardown).
		const capture: AstroLoggerMessage[] = [];
		const logger = new AstroLogger({
			destination: { write: (event) => capture.push(event) },
			level: (extraInlineConfig._logger as AstroLogger | undefined)?.level() ?? 'info',
		});
		// @ts-expect-error: `_logger` is an internal API
		await fixture.build({ ...extraInlineConfig, _logger: logger });
		return stripAnsi(normalizeTime(capture.map((log) => log.message).join('\n')));
	}

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheDir, { recursive: true, force: true });
		process.env.ASTRO_KEY = FIXED_KEY;
		fixture = await loadFixture({
			root,
			output: 'static',
			build: { concurrency: 4 },
			experimental: {
				incrementalBuild: true,
			},
			adapter: testAdapter(),
		});
	});

	after(() => {
		delete process.env.ASTRO_KEY;
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheDir, { recursive: true, force: true });
		fs.rmSync(new URL('pnpm-lock.yaml', root), { force: true });
	});

	it('cold build: prints the global missing-cache line, no-key suffix, and summary', async () => {
		const text = await build();
		assert.ok(text.includes('Incremental cache not found; performing a full build.'));
		assert.ok(text.includes('(not cacheable: no cacheKey)'), `missing no-key suffix in:\n${text}`);
		assert.ok(
			text.includes(
				` incremental build: ${TOTAL_PATHS} paths — 0 cached, 0 restored, ${TOTAL_PATHS} rendered (1 not stored)`,
			),
			`missing summary in:\n${text}`,
		);
		// The grouped table is printed for small builds.
		assert.ok(text.includes('Result    Reason'), `missing table in:\n${text}`);
		assert.ok(text.includes('src/pages/blog/[slug].astro'), `missing blog row in:\n${text}`);
	});

	it('unchanged build: restores every keyed path and reports the hit counts', async () => {
		const text = await build();
		assert.ok(text.includes('(restored)'), `unchanged keyed paths should restore:\n${text}`);
		assert.ok(!text.includes('(cache miss:'), `no misses expected:\n${text}`);
		assert.ok(
			text.includes(
				` incremental build: ${TOTAL_PATHS} paths — 0 cached, 10 restored, 1 rendered (1 not stored)`,
			),
		);
	});

	describe('changed content dependency (Callout in MDX render graph)', () => {
		const callout = new URL('src/components/Callout.astro', root);
		let original: string;

		before(async () => {
			original = fs.readFileSync(callout, 'utf-8');
			fs.writeFileSync(callout, original.replace('Callout v1', 'Callout v2'));
		});

		it('reports the changed content entry by path', async () => {
			const text = await build();
			assert.ok(
				text.includes('(cache miss: content dependency changed: src/content/docs/one.mdx)'),
				`missing content reason in:\n${text}`,
			);
			assert.ok(
				text.includes(
					` incremental build: ${TOTAL_PATHS} paths — 0 cached, 9 restored, 2 rendered (1 not stored)`,
				),
			);
		});

		after(() => {
			fs.writeFileSync(callout, original);
		});
	});

	describe('changed cacheKey (data module)', () => {
		const blogData = new URL('src/data/blog-data.json', root);
		let original: string;

		before(async () => {
			original = fs.readFileSync(blogData, 'utf-8');
			fs.writeFileSync(
				blogData,
				original.replace('"Post 2", "digest": "v1"', '"Post 2", "digest": "v2"'),
			);
		});

		it('renders the changed path with the dual module+key reason suffix', async () => {
			const text = await build();
			assert.ok(
				text.includes('(cache miss: module dependencies changed; cacheKey changed)'),
				`missing reason in:\n${text}`,
			);
			assert.ok(
				text.includes(
					` incremental build: ${TOTAL_PATHS} paths — 0 cached, 5 restored, 6 rendered (1 not stored)`,
				),
			);
		});

		after(() => {
			fs.writeFileSync(blogData, original);
		});
	});

	describe('changed module dependency (Sidebar graph)', () => {
		const dataFile = new URL('src/components/sidebar_data.ts', root);
		let original: string;

		before(async () => {
			original = fs.readFileSync(dataFile, 'utf-8');
			fs.writeFileSync(dataFile, original.replace("'Contact'", "'Contact', 'Blog'"));
		});

		it('reports module dependencies changed with a dependency tree', async () => {
			const text = await build();
			assert.ok(
				text.includes('(cache miss: module dependencies changed)'),
				`missing reason in:\n${text}`,
			);
			assert.ok(text.includes(' dependencies changed'), `missing tree header in:\n${text}`);
			assert.ok(text.includes('  src/pages/sidebar/[slug].astro'), `missing route in:\n${text}`);
			assert.ok(
				text.includes('  └─ src/components/Sidebar.astro'),
				`missing chain node in:\n${text}`,
			);
			assert.ok(
				text.includes('     └─ src/components/sidebar_data.ts (changed)'),
				`missing changed leaf in:\n${text}`,
			);
		});

		after(() => {
			fs.writeFileSync(dataFile, original);
		});
	});

	it('rotated server-island key: re-renders the island page with the exact reason', async () => {
		process.env.ASTRO_KEY = ROTATED_KEY;
		try {
			const text = await build();
			assert.ok(
				text.includes(
					'Incremental cache: server-island encryption key changed; affected pages will be rendered.',
				),
				`missing global island line in:\n${text}`,
			);
			assert.ok(
				text.includes('(cache miss: server-island encryption key changed)'),
				`missing island reason in:\n${text}`,
			);
		} finally {
			process.env.ASTRO_KEY = FIXED_KEY;
		}
	});

	it('deleted persistent output: re-renders with cached output missing', async () => {
		// The static adapter writes prerendered output under `client/`. Remove both
		// the rendered file and the cache's copy, so the restore fails and the
		// path is reported as `cached output missing`.
		fs.rmSync(new URL('dist/client/blog/post-1/index.html', root), { force: true });
		fs.rmSync(new URL('dist/client/blog/post-1/index.html', cacheDir), { force: true });
		const text = await build();
		assert.ok(
			text.includes('(cache miss: cached output missing)'),
			`missing cached-output-missing reason in:\n${text}`,
		);
	});

	it('force build: bypasses the cache with the exact reason', async () => {
		const text = await build({ force: true });
		assert.ok(
			text.includes('Incremental cache bypassed by --force; performing a full build.'),
			`missing force line in:\n${text}`,
		);
		assert.ok(
			text.includes('(cache miss: bypassed by --force)'),
			`missing force reason in:\n${text}`,
		);
		assert.ok(
			text.includes(
				` incremental build: ${TOTAL_PATHS} paths — 0 cached, 0 restored, ${TOTAL_PATHS} rendered (1 not stored)`,
			),
		);
	});

	describe('lockfile change', () => {
		const lockfile = new URL('pnpm-lock.yaml', root);
		let original: string | null;

		before(async () => {
			// The fixture has no lockfile, so the previous builds hashed the
			// workspace root's. Creating one at the fixture root changes the set of
			// lockfiles found and therefore the lockfile hash.
			original = fs.existsSync(lockfile) ? fs.readFileSync(lockfile, 'utf-8') : null;
			fs.writeFileSync(lockfile, 'lockfileVersion: "9.0"\n');
		});

		it('invalidates the cache with the exact global line and reason', async () => {
			const text = await build();
			assert.ok(
				text.includes('Incremental cache invalidated: dependency lockfile changed.'),
				`missing lockfile line in:\n${text}`,
			);
			assert.ok(
				text.includes('(cache miss: dependency lockfile changed)'),
				`missing lockfile reason in:\n${text}`,
			);
		});

		after(() => {
			if (original === null) fs.rmSync(lockfile, { force: true });
			else fs.writeFileSync(lockfile, original);
		});
	});

	it('config override: invalidates the cache with the exact global line', async () => {
		const text = await build({ compressHTML: true });
		assert.ok(
			text.includes('Incremental cache invalidated: Astro configuration changed.'),
			`missing config line in:\n${text}`,
		);
		assert.ok(
			text.includes('(cache miss: configuration changed; dependency lockfile changed)'),
			`missing config reason in:\n${text}`,
		);
	});

	it('malformed manifest: warns and falls back to a full build', async () => {
		fs.writeFileSync(cacheFile, 'not json {');
		const text = await build();
		assert.ok(
			text.includes('Incremental cache manifest is invalid; performing a full build.'),
			`missing invalid-manifest warn in:\n${text}`,
		);
		assert.ok(text.includes('(cache miss: cache unavailable)'), `missing reason in:\n${text}`);
	});

	it('downgraded cache version: reports the version change', async () => {
		const manifest = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		manifest.version = 0;
		fs.writeFileSync(cacheFile, JSON.stringify(manifest));
		const text = await build();
		assert.ok(
			text.includes('Incremental cache invalidated: cache format changed (version 0 → 1).'),
			`missing version line in:\n${text}`,
		);
		assert.ok(
			text.includes('(cache miss: cache format changed)'),
			`missing version reason in:\n${text}`,
		);
	});

	it('verbose build: prints one row per path', async () => {
		const debugLogger = new AstroLogger({
			destination: { write: () => {} },
			level: 'debug',
		});
		const text = await build({ _logger: debugLogger });
		assert.ok(text.includes('Route / path'), `missing verbose header in:\n${text}`);
		assert.ok(
			text.includes('src/pages/blog/[slug].astro /blog/post-1'),
			`missing verbose row in:\n${text}`,
		);
		assert.ok(
			text.includes(
				` incremental build: ${TOTAL_PATHS} paths — 0 cached, ${TOTAL_PATHS - 1} restored, 1 rendered (1 not stored)`,
			),
		);
	});
});

describe('experimental.incrementalBuild logging with a metadata-less prerenderer', () => {
	const untrackedCacheDir = new URL('node_modules/.astro-untracked/', root);
	let fixture: Fixture;
	let text = '';

	before(async () => {
		fs.rmSync(new URL('dist/logging-untracked/', root), { recursive: true, force: true });
		fs.rmSync(untrackedCacheDir, { recursive: true, force: true });
		const testPrerenderer = createTestPrerenderer();
		const logs: AstroLoggerMessage[] = [];
		const logger = new AstroLogger({
			destination: { write: (event) => logs.push(event) },
			level: 'info',
		});
		fixture = await loadFixture({
			root,
			outDir: './dist/logging-untracked/',
			cacheDir: './node_modules/.astro-untracked/',
			integrations: [testPrerenderer.integration],
			experimental: {
				incrementalBuild: true,
			},
			// The fixture contains a server-island page, which requires an adapter.
			adapter: testAdapter(),
			// @ts-expect-error: `_logger` is an internal API
			_logger: logger,
		});
		await fixture.build();
		text = stripAnsi(normalizeTime(logs.map((log) => log.message).join('\n')));
	});

	after(() => {
		fs.rmSync(new URL('dist/logging-untracked/', root), { recursive: true, force: true });
		fs.rmSync(untrackedCacheDir, { recursive: true, force: true });
	});

	it('flags keyed renders that produced no metadata', () => {
		assert.ok(
			text.includes('(not stored: prerender metadata unavailable)'),
			`missing storage note in:\n${text}`,
		);
		assert.ok(
			text.includes(
				'Incremental cache could not record 10 rendered paths because the prerenderer did not return incremental metadata; those paths will render again on the next build.',
			),
			`missing metadata warning in:\n${text}`,
		);
	});
});
