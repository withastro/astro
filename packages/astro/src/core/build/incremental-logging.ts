import type { AstroLogger } from '../logger/core.js';
import {
	INCREMENTAL_CACHE_VERSION,
	type DependencyChange,
	type IncrementalCacheLoadReason,
	type IncrementalCacheLoadResult,
	type IncrementalPathMissReason,
} from './incremental.js';
import { getTimeStat } from './util.js';

/**
 * One path's outcome during generation, collected so the post-build summary
 * reflects exactly what happened.
 */
export interface IncrementalPathOutcome {
	route: string;
	pathname: string;
	outputFile: string;
	result: 'cached' | 'restored' | 'rendered';
	reasons: IncrementalPathMissReason[];
	elapsedMs: number;
	stored: boolean;
	storageNote?: 'no-cache-key' | 'metadata-unavailable' | 'no-output';
}

/**
 * Format a miss reason as the text after `cache miss:` / `not cacheable:` on a
 * path line. Content entries are reported as paths (never raw keys), and a
 * single changed content entry names the entry while several are counted.
 */
function formatReasonToken(reason: IncrementalPathMissReason): string {
	switch (reason.type) {
		case 'no-cache-key':
			return 'no cacheKey';
		case 'global-cache':
			return reason.reasons.map((loadReason) => GLOBAL_REASON_TOKENS[loadReason]).join('; ');
		case 'new-route':
			return 'new route';
		case 'new-path':
			return 'new path';
		case 'island-key-changed':
			return 'server-island encryption key changed';
		case 'route-dependencies-changed':
			return 'module dependencies changed';
		case 'cache-key-changed':
			return 'cacheKey changed';
		case 'content-dependencies-changed':
			return reason.entries.length === 1
				? `content dependency changed: ${reason.entries[0]}`
				: `${reason.entries.length} content dependencies changed`;
		case 'cached-output-missing':
			return 'cached output missing';
	}
}

const GLOBAL_REASON_TOKENS: Record<IncrementalCacheLoadReason, string> = {
	loaded: 'cache loaded',
	forced: 'bypassed by --force',
	missing: 'cache not found',
	'invalid-manifest': 'cache unavailable',
	unreadable: 'cache unavailable',
	'version-changed': 'cache format changed',
	'config-changed': 'configuration changed',
	'lockfile-changed': 'dependency lockfile changed',
};

/**
 * The parenthetical appended to a rendered path's info line, e.g.
 * ` (cache miss: module dependencies changed; cacheKey changed)` or
 * ` (not cacheable: no cacheKey)`. Raw key values are never included.
 */
export function formatMissSuffix(reasons: IncrementalPathMissReason[]): string {
	if (reasons.length === 0) return '';
	const tokens = reasons.map(formatReasonToken);
	const verb = reasons.some((reason) => reason.type === 'no-cache-key')
		? 'not cacheable'
		: 'cache miss';
	return `(${verb}: ${tokens.join('; ')})`;
}

/**
 * Report the global cache state once, right after the cache is loaded and
 * before any path decisions are made. Correctness-preserving states (missing
 * cache, hash mismatches) are info; unusable manifests and unreadable files
 * are warnings. The manifest path is only mentioned in its cacheDir-relative
 * form under verbose logging.
 */
export function logCacheLoadResult(
	loadResult: IncrementalCacheLoadResult,
	logger: AstroLogger,
): void {
	for (const reason of loadResult.reasons) {
		switch (reason) {
			case 'forced':
				logger.info('cache', 'Incremental cache bypassed by --force; performing a full build.');
				break;
			case 'missing':
				logger.info('cache', 'Incremental cache not found; performing a full build.');
				break;
			case 'invalid-manifest':
				logger.warn('cache', 'Incremental cache manifest is invalid; performing a full build.');
				break;
			case 'unreadable':
				logger.warn(
					'cache',
					`Incremental cache could not be read; performing a full build.${
						loadResult.errorCode ? ` (${loadResult.errorCode})` : ''
					}`,
				);
				break;
			case 'version-changed':
				logger.info(
					'cache',
					`Incremental cache invalidated: cache format changed (version ${loadResult.previousVersion} → ${INCREMENTAL_CACHE_VERSION}).`,
				);
				break;
			case 'config-changed':
				logger.info('cache', 'Incremental cache invalidated: Astro configuration changed.');
				break;
			case 'lockfile-changed':
				logger.info('cache', 'Incremental cache invalidated: dependency lockfile changed.');
				break;
			case 'loaded':
				if (logger.level() === 'debug') {
					logger.info('cache', 'Incremental cache loaded from incremental-build.json.');
				}
				break;
		}
	}
	if (loadResult.islandKeyChanged) {
		logger.info(
			'cache',
			'Incremental cache: server-island encryption key changed; affected pages will be rendered.',
		);
	}
}

const TABLE_ROUTE_HEADER = 'Route';
const TABLE_RESULT_HEADER = 'Result';
const TABLE_REASON_HEADER = 'Reason';
const TABLE_PATHS_HEADER = 'Paths';
const TABLE_TIME_HEADER = 'Time';

interface GroupedRow {
	route: string;
	result: string;
	reason: string;
	paths: number;
	elapsedMs: number;
}

const RESULT_ORDER = { cached: 0, restored: 1, rendered: 2 } as const;

function formatTime(elapsedMs: number): string {
	if (elapsedMs < 1) return '<1ms';
	return getTimeStat(0, elapsedMs);
}

/**
 * Collects per-path outcomes during generation and prints the post-build
 * summary: reuse counts, a grouped route table (compact reason totals when the
 * table would be too large), dependency-change trees, and a warning when keyed
 * renders produced no incremental metadata.
 */
export class IncrementalBuildReporter {
	readonly #outcomes: IncrementalPathOutcome[] = [];

	/** Record a completed path. Pushing synchronously keeps concurrent path
	 * generation from interleaving the summary. */
	push(outcome: IncrementalPathOutcome): void {
		this.#outcomes.push(outcome);
	}

	printSummary(logger: AstroLogger): void {
		if (this.#outcomes.length === 0) return;
		const verbose = logger.level() === 'debug';

		const cached = this.#outcomes.filter((outcome) => outcome.result === 'cached').length;
		const restored = this.#outcomes.filter((outcome) => outcome.result === 'restored').length;
		const rendered = this.#outcomes.length - cached - restored;
		const notStored = this.#outcomes.filter(
			(outcome) => outcome.result === 'rendered' && !outcome.stored,
		).length;

		let summary = ` incremental build: ${this.#outcomes.length} paths — ${cached} cached, ${restored} restored, ${rendered} rendered`;
		if (notStored > 0) summary += ` (${notStored} not stored)`;
		logger.info('SKIP_FORMAT', summary);

		const grouped = this.#groupRows();
		if (verbose) {
			this.#printPathTable(logger, this.#outcomes);
		} else if (grouped.length <= MAX_GROUPED_ROWS) {
			this.#printGroupedTable(logger, grouped);
		} else {
			this.#printCompactTotals(logger, grouped);
		}

		this.#printDependencyTrees(logger, verbose);

		const missingMetadata = this.#outcomes.filter(
			(outcome) => outcome.storageNote === 'metadata-unavailable',
		).length;
		if (missingMetadata > 0) {
			logger.warn(
				'cache',
				`Incremental cache could not record ${missingMetadata} rendered path${
					missingMetadata === 1 ? '' : 's'
				} because the prerenderer did not return incremental metadata; those paths will render again on the next build.`,
			);
		}
	}

	/** Group outcomes by route, result, and exact reason text, sorted
	 * deterministically so concurrent completion order never changes the table. */
	#groupRows(): GroupedRow[] {
		const groups = new Map<string, GroupedRow>();
		for (const outcome of this.#outcomes) {
			const reason =
				outcome.reasons.length === 0
					? 'cache hit'
					: outcome.reasons.map(formatReasonToken).join('; ');
			const key = `${outcome.route}\u0000${outcome.result}\u0000${reason}`;
			let row = groups.get(key);
			if (!row) {
				row = { route: outcome.route, result: outcome.result, reason, paths: 0, elapsedMs: 0 };
				groups.set(key, row);
			}
			row.paths++;
			row.elapsedMs += outcome.elapsedMs;
		}
		return [...groups.values()].sort((a, b) => {
			if (a.route !== b.route) return a.route < b.route ? -1 : 1;
			if (
				RESULT_ORDER[a.result as keyof typeof RESULT_ORDER] !==
				RESULT_ORDER[b.result as keyof typeof RESULT_ORDER]
			) {
				return RESULT_ORDER[a.result as keyof typeof RESULT_ORDER] <
					RESULT_ORDER[b.result as keyof typeof RESULT_ORDER]
					? -1
					: 1;
			}
			return a.reason < b.reason ? -1 : a.reason > b.reason ? 1 : 0;
		});
	}

	/** The info-level route table, printed when it has few enough rows. */
	#printGroupedTable(logger: AstroLogger, rows: GroupedRow[]): void {
		const routeWidth =
			Math.max(TABLE_ROUTE_HEADER.length, ...rows.map((row) => row.route.length)) + 10;
		const resultWidth =
			Math.max(TABLE_RESULT_HEADER.length, ...rows.map((row) => row.result.length)) + 2;
		const reasonWidth =
			Math.max(TABLE_REASON_HEADER.length, ...rows.map((row) => row.reason.length)) + 2;
		const pathsWidth = Math.max(
			TABLE_PATHS_HEADER.length,
			...rows.map((row) => String(row.paths).length),
		);

		const lines = [
			` ${TABLE_ROUTE_HEADER.padEnd(routeWidth)}${TABLE_RESULT_HEADER.padEnd(resultWidth)}${TABLE_REASON_HEADER.padEnd(reasonWidth)}${TABLE_PATHS_HEADER.padStart(pathsWidth)}  ${TABLE_TIME_HEADER}`,
			...rows.map(
				(row) =>
					` ${row.route.padEnd(routeWidth)}${row.result.padEnd(resultWidth)}${row.reason.padEnd(reasonWidth)}${String(row.paths).padStart(pathsWidth)}  ${formatTime(row.elapsedMs)}`,
			),
		];
		logger.info('SKIP_FORMAT', `\n${lines.join('\n')}`);
	}

	/** Compact reason totals instead of the route table when it is too large. */
	#printCompactTotals(logger: AstroLogger, rows: GroupedRow[]): void {
		const counts = new Map<string, number>();
		for (const outcome of this.#outcomes) {
			for (const reason of outcome.reasons) {
				const token = compactReasonToken(reason);
				counts.set(token, (counts.get(token) ?? 0) + 1);
			}
		}
		const totals = [...counts.entries()].sort(
			(a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
		);
		logger.info(
			'SKIP_FORMAT',
			`\n reasons: ${totals.map(([token, count]) => `${token} ${count}`).join('; ')}\n route table omitted (${rows.length} rows); rerun with --verbose to show all`,
		);
	}

	/** The verbose one-row-per-path table. */
	#printPathTable(logger: AstroLogger, outcomes: IncrementalPathOutcome[]): void {
		const rows = [...outcomes].sort((a, b) => {
			const routeCompare = a.route < b.route ? -1 : a.route > b.route ? 1 : 0;
			if (routeCompare !== 0) return routeCompare;
			const pathCompare = a.pathname < b.pathname ? -1 : a.pathname > b.pathname ? 1 : 0;
			if (pathCompare !== 0) return pathCompare;
			return RESULT_ORDER[a.result] - RESULT_ORDER[b.result];
		});
		const routeWidth =
			Math.max('Route / path'.length, ...rows.map((row) => `${row.route} ${row.pathname}`.length)) +
			10;
		const resultWidth =
			Math.max(TABLE_RESULT_HEADER.length, ...rows.map((row) => row.result.length)) + 2;
		const reasonWidth =
			Math.max(
				TABLE_REASON_HEADER.length,
				...rows.map(
					(row) =>
						(row.reasons.length === 0 ? 'cache hit' : row.reasons.map(formatReasonToken).join('; '))
							.length,
				),
			) + 2;

		const lines = [
			` ${'Route / path'.padEnd(routeWidth)}${TABLE_RESULT_HEADER.padEnd(resultWidth)}${TABLE_REASON_HEADER.padEnd(reasonWidth)}${TABLE_TIME_HEADER}`,
			...rows.map((row) => {
				const reason =
					row.reasons.length === 0 ? 'cache hit' : row.reasons.map(formatReasonToken).join('; ');
				return ` ${`${row.route} ${row.pathname}`.padEnd(routeWidth)}${row.result.padEnd(resultWidth)}${reason.padEnd(reasonWidth)}${formatTime(row.elapsedMs)}`;
			}),
		];
		logger.info('SKIP_FORMAT', `\n${lines.join('\n')}`);
	}

	/** Dependency-change trees, capped at info level and complete under verbose. */
	#printDependencyTrees(logger: AstroLogger, verbose: boolean): void {
		interface Tree {
			route: string;
			/** Display chains; each starts with a boundary node for content/client changes. */
			chains: DependencyChange[];
			unavailable: 'missing-diagnostics' | 'unavailable' | null;
		}
		const byRoute = new Map<string, Tree>();
		for (const outcome of this.#outcomes) {
			for (const reason of outcome.reasons) {
				if (reason.type === 'route-dependencies-changed') {
					let tree = byRoute.get(outcome.route);
					if (!tree) {
						tree = { route: outcome.route, chains: [], unavailable: null };
						byRoute.set(outcome.route, tree);
					}
					if (reason.changes) tree.chains.push(...reason.changes);
					tree.unavailable ??= reason.diagnosticsUnavailable ?? null;
				} else if (reason.type === 'content-dependencies-changed') {
					let tree = byRoute.get(outcome.route);
					if (!tree) {
						tree = { route: outcome.route, chains: [], unavailable: null };
						byRoute.set(outcome.route, tree);
					}
					for (const entryPath of reason.entries) {
						const entryChains = reason.changes?.[entryPath];
						if (entryChains && entryChains.length > 0) {
							tree.chains.push(...entryChains);
						} else {
							tree.unavailable ??= reason.diagnosticsUnavailable ?? 'unavailable';
						}
					}
				}
			}
		}
		if (byRoute.size === 0) return;

		const trees = [...byRoute.values()].sort((a, b) =>
			a.route < b.route ? -1 : a.route > b.route ? 1 : 0,
		);
		for (const tree of trees) {
			tree.chains.sort((a, b) =>
				a.chain[a.chain.length - 1] < b.chain[b.chain.length - 1]
					? -1
					: a.chain[a.chain.length - 1] > b.chain[b.chain.length - 1]
						? 1
						: a.chain.join('\u0000') < b.chain.join('\u0000')
							? -1
							: 1,
			);
		}

		const totalChains = trees.reduce((sum, tree) => sum + tree.chains.length, 0);
		let printedChains = 0;
		const lines: string[] = [' dependencies changed'];
		for (let routeIndex = 0; routeIndex < trees.length; routeIndex++) {
			const tree = trees[routeIndex];
			if (!verbose && routeIndex >= MAX_TREE_ROUTES) break;
			let shown = verbose
				? tree.chains.length
				: Math.min(tree.chains.length, MAX_TREE_CHAINS_PER_ROUTE);
			if (!verbose && printedChains + shown > MAX_TREE_CHAINS) {
				shown = Math.max(0, MAX_TREE_CHAINS - printedChains);
			}
			const showsUnavailable = tree.unavailable !== null && (verbose || shown === 0);
			if (shown === 0 && !showsUnavailable) continue;
			lines.push(`  ${tree.route}`);
			for (let i = 0; i < shown; i++) {
				const change = tree.chains[i];
				printedChains++;
				for (let depth = 0; depth < change.chain.length; depth++) {
					const status = depth === change.chain.length - 1 ? ` (${change.status})` : '';
					lines.push(`${' '.repeat(2 + 3 * depth)}└─ ${change.chain[depth]}${status}`);
				}
			}
			if (showsUnavailable) {
				lines.push(
					`  └─ dependency details unavailable${
						tree.unavailable === 'missing-diagnostics' ? ' (rerun once to seed diagnostics)' : ''
					}`,
				);
			}
		}
		const droppedChains = totalChains - printedChains;
		if (droppedChains > 0) {
			lines.push(`… ${droppedChains} more dependency change(s); rerun with --verbose to show all`);
		}
		logger.info('SKIP_FORMAT', `\n${lines.join('\n')}`);
	}
}

/** Aggregate counts use reason-type-level tokens without per-entry paths. */
function compactReasonToken(reason: IncrementalPathMissReason): string {
	switch (reason.type) {
		case 'no-cache-key':
			return 'no cacheKey';
		case 'global-cache':
			return reason.reasons.map((loadReason) => GLOBAL_REASON_TOKENS[loadReason]).join('; ');
		case 'new-route':
			return 'new route';
		case 'new-path':
			return 'new path';
		case 'island-key-changed':
			return 'server-island encryption key changed';
		case 'route-dependencies-changed':
			return 'module dependencies changed';
		case 'cache-key-changed':
			return 'cacheKey changed';
		case 'content-dependencies-changed':
			return reason.entries.length === 1
				? 'content dependency changed'
				: 'content dependencies changed';
		case 'cached-output-missing':
			return 'cached output missing';
	}
}

const MAX_GROUPED_ROWS = 20;
const MAX_TREE_ROUTES = 5;
const MAX_TREE_CHAINS_PER_ROUTE = 3;
const MAX_TREE_CHAINS = 15;
