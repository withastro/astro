import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroLogger, type AstroLoggerMessage } from '../../../dist/core/logger/core.js';
import {
	formatMissSuffix,
	IncrementalBuildReporter,
	logCacheLoadResult,
	type IncrementalPathOutcome,
} from '../../../dist/core/build/incremental-logging.js';
import type {
	IncrementalCacheLoadResult,
	IncrementalPathMissReason,
} from '../../../dist/core/build/incremental.js';

function captureLogger(level: 'info' | 'debug' = 'info'): {
	logger: AstroLogger;
	logs: AstroLoggerMessage[];
} {
	const logs: AstroLoggerMessage[] = [];
	const logger = new AstroLogger({
		destination: {
			write(event) {
				logs.push(event);
			},
		},
		level,
	});
	return { logger, logs };
}

function outcome(
	route: string,
	pathname: string,
	result: IncrementalPathOutcome['result'],
	reasons: IncrementalPathMissReason[] = [],
	{
		elapsedMs = 0,
		stored = true,
		storageNote,
	}: {
		elapsedMs?: number;
		stored?: boolean;
		storageNote?: IncrementalPathOutcome['storageNote'];
	} = {},
): IncrementalPathOutcome {
	return {
		route,
		pathname,
		outputFile: `${pathname}/index.html`,
		result,
		reasons,
		elapsedMs,
		stored,
		storageNote,
	};
}

/** Replace volatile duration strings so exact snapshots stay stable. */
function normalizeTime(text: string): string {
	return text.replace(/<1ms|\d+(?:\.\d+)?m?s/g, '<time>');
}

describe('logCacheLoadResult', () => {
	it('prints the exact global messages for every load reason', () => {
		const { logger, logs } = captureLogger();
		const loadResult: IncrementalCacheLoadResult = {
			previous: null,
			reasons: [
				'forced',
				'missing',
				'invalid-manifest',
				'unreadable',
				'version-changed',
				'config-changed',
				'lockfile-changed',
			],
			previousVersion: 0,
			errorCode: 'EACCES',
			islandKeyChanged: true,
		};
		logCacheLoadResult(loadResult, logger);
		const messages = logs.map((log) => log.message);
		assert.ok(messages.includes('Incremental cache bypassed by --force; performing a full build.'));
		assert.ok(messages.includes('Incremental cache not found; performing a full build.'));
		assert.ok(messages.includes('Incremental cache manifest is invalid; performing a full build.'));
		assert.ok(
			messages.includes('Incremental cache could not be read; performing a full build. (EACCES)'),
		);
		assert.ok(
			messages.includes('Incremental cache invalidated: cache format changed (version 0 → 1).'),
		);
		assert.ok(messages.includes('Incremental cache invalidated: Astro configuration changed.'));
		assert.ok(messages.includes('Incremental cache invalidated: dependency lockfile changed.'));
		assert.ok(
			messages.includes(
				'Incremental cache: server-island encryption key changed; affected pages will be rendered.',
			),
		);
		// Invalid-manifest and unreadable are warnings; everything else is info.
		assert.deepEqual(
			logs.filter((log) => log.level === 'warn').map((log) => log.message),
			[
				'Incremental cache manifest is invalid; performing a full build.',
				'Incremental cache could not be read; performing a full build. (EACCES)',
			],
		);
	});

	it('omits the error code when none is available', () => {
		const { logger, logs } = captureLogger();
		logCacheLoadResult(
			{ previous: null, reasons: ['unreadable'], islandKeyChanged: false },
			logger,
		);
		assert.ok(
			logs.some(
				(log) => log.message === 'Incremental cache could not be read; performing a full build.',
			),
		);
	});

	it('is silent about a loaded cache at info level but reports it under verbose', () => {
		const infoLogs = captureLogger();
		logCacheLoadResult(
			{ previous: {}, reasons: ['loaded'], islandKeyChanged: false } as IncrementalCacheLoadResult,
			infoLogs.logger,
		);
		assert.ok(!infoLogs.logs.some((log) => log.message.includes('loaded from')));

		const verboseLogs = captureLogger('debug');
		logCacheLoadResult(
			{ previous: {}, reasons: ['loaded'], islandKeyChanged: false } as IncrementalCacheLoadResult,
			verboseLogs.logger,
		);
		assert.ok(
			verboseLogs.logs.some(
				(log) => log.message === 'Incremental cache loaded from incremental-build.json.',
			),
		);
	});
});

describe('formatMissSuffix', () => {
	it('formats every miss reason exactly', () => {
		const cases: Array<[IncrementalPathMissReason[], string]> = [
			[[{ type: 'no-cache-key' }], '(not cacheable: no cacheKey)'],
			[[{ type: 'global-cache', reasons: ['forced'] }], '(cache miss: bypassed by --force)'],
			[[{ type: 'global-cache', reasons: ['missing'] }], '(cache miss: cache not found)'],
			[
				[{ type: 'global-cache', reasons: ['invalid-manifest'] }],
				'(cache miss: cache unavailable)',
			],
			[[{ type: 'global-cache', reasons: ['unreadable'] }], '(cache miss: cache unavailable)'],
			[
				[{ type: 'global-cache', reasons: ['version-changed'] }],
				'(cache miss: cache format changed)',
			],
			[
				[{ type: 'global-cache', reasons: ['config-changed'] }],
				'(cache miss: configuration changed)',
			],
			[
				[{ type: 'global-cache', reasons: ['lockfile-changed'] }],
				'(cache miss: dependency lockfile changed)',
			],
			[
				[{ type: 'global-cache', reasons: ['config-changed', 'lockfile-changed'] }],
				'(cache miss: configuration changed; dependency lockfile changed)',
			],
			[[{ type: 'new-route' }], '(cache miss: new route)'],
			[[{ type: 'new-path' }], '(cache miss: new path)'],
			[[{ type: 'island-key-changed' }], '(cache miss: server-island encryption key changed)'],
			[[{ type: 'route-dependencies-changed' }], '(cache miss: module dependencies changed)'],
			[[{ type: 'cache-key-changed' }], '(cache miss: cacheKey changed)'],
			[
				[{ type: 'content-dependencies-changed', entries: ['src/content/docs/one.mdx'] }],
				'(cache miss: content dependency changed: src/content/docs/one.mdx)',
			],
			[
				[
					{
						type: 'content-dependencies-changed',
						entries: ['src/content/docs/one.mdx', 'src/content/docs/two.mdx'],
					},
				],
				'(cache miss: 2 content dependencies changed)',
			],
			[[{ type: 'cached-output-missing' }], '(cache miss: cached output missing)'],
		];
		for (const [reasons, expected] of cases) {
			assert.equal(formatMissSuffix(reasons), expected);
		}
	});

	it('lists multiple reasons in the given order', () => {
		assert.equal(
			formatMissSuffix([{ type: 'route-dependencies-changed' }, { type: 'cache-key-changed' }]),
			'(cache miss: module dependencies changed; cacheKey changed)',
		);
	});

	it('never discloses raw cacheKey values', () => {
		// A key can be a token, user data, or a large serialized object; only the
		// fact that it changed is reported.
		assert.equal(
			formatMissSuffix([{ type: 'cache-key-changed' }]),
			'(cache miss: cacheKey changed)',
		);
		assert.ok(!formatMissSuffix([{ type: 'cache-key-changed' }]).includes('secret-token'));
	});

	it('returns nothing when there are no reasons', () => {
		assert.equal(formatMissSuffix([]), '');
	});
});

describe('IncrementalBuildReporter', () => {
	const BLOG = 'src/pages/blog/[slug].astro';
	const ABOUT = 'src/pages/about.astro';

	function print(
		level: 'info' | 'debug',
		outcomes: IncrementalPathOutcome[],
	): { logs: AstroLoggerMessage[]; text: string } {
		const { logger, logs } = captureLogger(level);
		const reporter = new IncrementalBuildReporter();
		for (const item of outcomes) reporter.push(item);
		reporter.printSummary(logger);
		return { logs, text: logs.map((log) => log.message).join('\n') };
	}

	it('prints nothing when no paths were processed', () => {
		const { logs } = print('info', []);
		assert.equal(logs.length, 0);
	});

	it('prints the one-line summary with hit/miss counts', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'cached', [], { elapsedMs: 1 }),
			outcome(BLOG, '/blog/post-1', 'restored', [], { elapsedMs: 2 }),
			outcome(BLOG, '/blog/post-2', 'rendered', [{ type: 'cache-key-changed' }], { elapsedMs: 5 }),
			outcome(ABOUT, '/about', 'rendered', [{ type: 'no-cache-key' }], {
				stored: false,
				elapsedMs: 3,
			}),
		]);
		assert.ok(
			text.includes(
				' incremental build: 4 paths — 1 cached, 1 restored, 2 rendered (1 not stored)',
			),
		);
	});

	it('omits the not-stored count when everything was stored', () => {
		const { text } = print('info', [outcome(BLOG, '/blog/post-1', 'cached', [])]);
		assert.ok(text.includes(' incremental build: 1 paths — 1 cached, 0 restored, 0 rendered'));
		assert.ok(!text.includes('not stored'));
	});

	it('prints the grouped route table with deterministic sorting', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-3', 'rendered', [{ type: 'cache-key-changed' }], { elapsedMs: 31 }),
			outcome(BLOG, '/blog/post-2', 'rendered', [{ type: 'cache-key-changed' }], { elapsedMs: 30 }),
			outcome(BLOG, '/blog/post-1', 'cached', [], { elapsedMs: 9 }),
			outcome(ABOUT, '/about', 'rendered', [{ type: 'no-cache-key' }], {
				stored: false,
				elapsedMs: 3,
			}),
		]);
		const normalized = normalizeTime(text);
		assert.ok(
			normalized.includes(
				' Route                                Result    Reason            Paths  Time',
			),
			`missing header in:\n${normalized}`,
		);
		// Rows are sorted by route, then cached < restored < rendered.
		const aboutIndex = normalized.indexOf('src/pages/about.astro');
		const cachedIndex = normalized.indexOf('src/pages/blog/[slug].astro          cached');
		assert.ok(aboutIndex < cachedIndex, 'about sorts before blog');
		assert.ok(
			normalized.includes(
				'src/pages/blog/[slug].astro          cached    cache hit             1  <time>',
			),
		);
		assert.ok(
			normalized.includes(
				'src/pages/blog/[slug].astro          rendered  cacheKey changed      2  <time>',
			),
		);
		assert.ok(
			normalized.includes(
				'src/pages/about.astro                rendered  no cacheKey           1  <time>',
			),
		);
	});

	it('aggregates path counts and time per group', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'restored', [], { elapsedMs: 4 }),
			outcome(BLOG, '/blog/post-2', 'restored', [], { elapsedMs: 5 }),
		]);
		const normalized = normalizeTime(text);
		assert.ok(
			normalized.includes(
				'src/pages/blog/[slug].astro          restored  cache hit      2  <time>',
			),
		);
	});

	it('switches to compact totals beyond 20 grouped rows', () => {
		const outcomes = Array.from({ length: 21 }, (_, i) =>
			outcome(`src/pages/route-${i}.astro`, `/page-${i}`, 'rendered', [{ type: 'new-path' }], {
				stored: false,
			}),
		);
		const { text } = print('info', outcomes);
		assert.ok(!text.includes('Route                                  Result'));
		assert.ok(text.includes(' reasons: new path 21'));
		assert.ok(text.includes(' route table omitted (21 rows); rerun with --verbose to show all'));
	});

	it('prints the full table at exactly 20 grouped rows', () => {
		const outcomes = Array.from({ length: 20 }, (_, i) =>
			outcome(`src/pages/route-${i}.astro`, `/page-${i}`, 'rendered', [{ type: 'new-path' }], {
				stored: false,
			}),
		);
		const { text } = print('info', outcomes);
		for (let i = 0; i < 20; i++) {
			assert.ok(
				text.includes(`src/pages/route-${i}.astro`),
				`route-${i} should be in the table:\n${text}`,
			);
		}
		assert.ok(!text.includes('route table omitted'));
	});

	it('aggregates compact totals by reason across paths', () => {
		// More than 20 grouped rows forces the compact totals view.
		const outcomes = [
			...Array.from({ length: 11 }, (_, i) =>
				outcome(`src/pages/deps-${i}.astro`, `/deps-${i}`, 'rendered', [
					{ type: 'route-dependencies-changed' },
				]),
			),
			...Array.from({ length: 6 }, (_, i) =>
				outcome(`src/pages/keys-${i}.astro`, `/keys-${i}`, 'rendered', [
					{ type: 'cache-key-changed' },
				]),
			),
			...Array.from({ length: 5 }, (_, i) =>
				outcome(
					`src/pages/nokey-${i}.astro`,
					`/nokey-${i}`,
					'rendered',
					[{ type: 'no-cache-key' }],
					{
						stored: false,
					},
				),
			),
		];
		const { text } = print('info', outcomes);
		assert.ok(
			text.includes(' reasons: module dependencies changed 11; cacheKey changed 6; no cacheKey 5'),
		);
	});

	it('prints one row per path under verbose logging', () => {
		const { text } = print('debug', [
			outcome(BLOG, '/blog/post-1', 'cached', [], { elapsedMs: 1 }),
			outcome(BLOG, '/blog/post-2', 'rendered', [{ type: 'cache-key-changed' }], { elapsedMs: 12 }),
		]);
		const normalized = normalizeTime(text);
		assert.ok(
			normalized.includes(
				' Route / path                                      Result    Reason            Time',
			),
			`missing verbose header in:\n${normalized}`,
		);
		assert.ok(
			normalized.includes(
				'src/pages/blog/[slug].astro /blog/post-1          cached    cache hit         <time>',
			),
		);
		assert.ok(
			normalized.includes(
				'src/pages/blog/[slug].astro /blog/post-2          rendered  cacheKey changed  <time>',
			),
		);
	});

	it('prints dependency-change trees with status labels', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [
				{
					type: 'route-dependencies-changed',
					changes: [
						{
							status: 'changed',
							chain: ['src/components/Sidebar.astro', 'src/data/sidebar_data.ts'],
						},
					],
				},
			]),
		]);
		assert.ok(text.includes(' dependencies changed'), `missing trees in:\n${text}`);
		assert.ok(text.includes(`  ${BLOG}`));
		assert.ok(text.includes('  └─ src/components/Sidebar.astro'));
		assert.ok(text.includes('     └─ src/data/sidebar_data.ts (changed)'));
	});

	it('prints the rerun hint when the diagnostics were missing', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [
				{ type: 'route-dependencies-changed', diagnosticsUnavailable: 'missing-diagnostics' },
			]),
		]);
		assert.ok(text.includes('└─ dependency details unavailable (rerun once to seed diagnostics)'));
	});

	it('prints plain unavailable without the rerun hint', () => {
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [
				{ type: 'route-dependencies-changed', diagnosticsUnavailable: 'unavailable' },
			]),
		]);
		assert.ok(text.includes('  └─ dependency details unavailable'));
		assert.ok(!text.includes('rerun once to seed diagnostics'));
	});

	it('caps trees at info level and reports the remainder', () => {
		const chains = Array.from({ length: 6 }, (_, i) => ({
			status: 'changed' as const,
			chain: [`src/components/C${i}.astro`, `src/data/data_${i}.ts`],
		}));
		const { text } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [
				{ type: 'route-dependencies-changed', changes: chains },
			]),
		]);
		// 6 chains on one route: capped to 3 per route, 15 total.
		const leafLines = text.split('\n').filter((line) => line.includes(' (changed)'));
		assert.equal(leafLines.length, 3);
		assert.ok(text.includes('… 3 more dependency change(s); rerun with --verbose to show all'));
	});

	it('shows all trees under verbose logging', () => {
		const chains = Array.from({ length: 6 }, (_, i) => ({
			status: 'changed' as const,
			chain: [`src/components/C${i}.astro`, `src/data/data_${i}.ts`],
		}));
		const { text } = print('debug', [
			outcome(BLOG, '/blog/post-1', 'rendered', [
				{ type: 'route-dependencies-changed', changes: chains },
			]),
		]);
		const leafLines = text.split('\n').filter((line) => line.includes(' (changed)'));
		assert.equal(leafLines.length, 6);
		assert.ok(!text.includes('more dependency change(s)'));
	});

	it('prints a singular metadata warning for one path', () => {
		const { logs } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [{ type: 'cache-key-changed' }], {
				stored: false,
				storageNote: 'metadata-unavailable',
			}),
		]);
		assert.ok(
			logs.some(
				(log) =>
					log.level === 'warn' &&
					log.message ===
						'Incremental cache could not record 1 rendered path because the prerenderer did not return incremental metadata; those paths will render again on the next build.',
			),
		);
	});

	it('prints a plural metadata warning for several paths', () => {
		const { logs } = print('info', [
			outcome(BLOG, '/blog/post-1', 'rendered', [], {
				stored: false,
				storageNote: 'metadata-unavailable',
			}),
			outcome(BLOG, '/blog/post-2', 'rendered', [], {
				stored: false,
				storageNote: 'metadata-unavailable',
			}),
		]);
		assert.ok(
			logs.some(
				(log) =>
					log.level === 'warn' &&
					log.message ===
						'Incremental cache could not record 2 rendered paths because the prerenderer did not return incremental metadata; those paths will render again on the next build.',
			),
		);
	});

	it('does not warn for no-key renders', () => {
		const { logs } = print('info', [
			outcome(ABOUT, '/about', 'rendered', [{ type: 'no-cache-key' }], { stored: false }),
		]);
		assert.ok(!logs.some((log) => log.level === 'warn'));
	});
});
