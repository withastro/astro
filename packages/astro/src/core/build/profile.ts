import fs from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import colors from 'piccolore';
import type { AstroLogger } from '../logger/core.js';
import { getTimeStat } from './util.js';

export const BUILD_PROFILE_VERSION = 1;
export const BUILD_PROFILE_FILENAME = 'build-profile.json';

export type PageStatus = 'rendered' | 'cached' | 'restored' | 'empty';

interface PhaseEntry {
	name: string;
	startMs: number;
	durationMs: number;
}

interface HookEntry {
	integration: string;
	hook: string;
	durationMs: number;
}

interface PageEntry {
	pathname: string;
	route: string;
	component: string;
	status: PageStatus;
	durationMs: number;
}

interface ImageEntry {
	src: string;
	transforms: number;
	durationMs: number;
}

interface RouteSummary {
	route: string;
	component: string;
	paths: number;
	rendered: number;
	cached: number;
	totalMs: number;
	avgMs: number;
	p95Ms: number;
	maxMs: number;
	slowestPath: string;
}

export interface BuildProfileEnvironment {
	astroVersion: string;
	buildOutput: string | undefined;
	adapter: string | undefined;
	prerenderer: string | undefined;
	concurrency: number;
}

export interface BuildProfileReport {
	version: typeof BUILD_PROFILE_VERSION;
	environment: BuildProfileEnvironment & { node: string; platform: string; cpus: number };
	totalMs: number;
	phases: PhaseEntry[];
	hooks: HookEntry[];
	routes: RouteSummary[];
	pages: PageEntry[];
	images: ImageEntry[];
}

const round = (ms: number) => Math.round(ms * 100) / 100;

/**
 * Collects timings for a single `astro build --profile` run. Durations are wall-clock, so
 * work that runs concurrently (pages with `build.concurrency > 1`, images) overlaps.
 */
export class BuildProfile {
	readonly #origin = performance.now();
	#phases: PhaseEntry[] = [];
	#hooks: HookEntry[] = [];
	#pages: PageEntry[] = [];
	#images: ImageEntry[] = [];

	/** Starts a named phase. Call the returned function when the phase ends. */
	phase(name: string): () => void {
		const start = performance.now();
		return () => {
			this.#phases.push({
				name,
				startMs: round(start - this.#origin),
				durationMs: round(performance.now() - start),
			});
		};
	}

	recordHook(integration: string, hook: string, durationMs: number) {
		this.#hooks.push({ integration, hook, durationMs: round(durationMs) });
	}

	recordPage(page: PageEntry) {
		this.#pages.push({ ...page, durationMs: round(page.durationMs) });
	}

	recordImage(image: ImageEntry) {
		this.#images.push({ ...image, durationMs: round(image.durationMs) });
	}

	toReport(environment: BuildProfileEnvironment): BuildProfileReport {
		return {
			version: BUILD_PROFILE_VERSION,
			environment: {
				...environment,
				node: process.version,
				platform: `${process.platform}-${process.arch}`,
				cpus: os.availableParallelism(),
			},
			totalMs: round(performance.now() - this.#origin),
			phases: this.#phases,
			hooks: this.#hooks,
			routes: summarizeRoutes(this.#pages),
			pages: this.#pages,
			images: this.#images,
		};
	}
}

/** Aggregates pages by route and sorts routes by the total time spent rendering them. */
export function summarizeRoutes(pages: PageEntry[]): RouteSummary[] {
	const byRoute = new Map<string, PageEntry[]>();
	for (const page of pages) {
		const list = byRoute.get(page.route);
		if (list) list.push(page);
		else byRoute.set(page.route, [page]);
	}

	const routes: RouteSummary[] = [];
	for (const [route, entries] of byRoute) {
		const rendered = entries.filter((p) => p.status === 'rendered' || p.status === 'empty');
		const durations = rendered.map((p) => p.durationMs).sort((a, b) => a - b);
		const totalMs = durations.reduce((a, b) => a + b, 0);
		const slowest = rendered.reduce<PageEntry | undefined>(
			(max, p) => (!max || p.durationMs > max.durationMs ? p : max),
			undefined,
		);
		routes.push({
			route,
			component: entries[0].component,
			paths: entries.length,
			rendered: rendered.length,
			cached: entries.length - rendered.length,
			totalMs: round(totalMs),
			avgMs: durations.length ? round(totalMs / durations.length) : 0,
			p95Ms: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : 0,
			maxMs: durations.at(-1) ?? 0,
			slowestPath: slowest?.pathname ?? '',
		});
	}
	return routes.sort((a, b) => b.totalMs - a.totalMs);
}

/** Writes the report to `.astro/build-profile.json` and returns the file path. */
export function writeBuildProfile(report: BuildProfileReport, dotAstroDir: URL): string {
	const file = fileURLToPath(new URL(BUILD_PROFILE_FILENAME, dotAstroDir));
	fs.mkdirSync(fileURLToPath(dotAstroDir), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(report, null, 2));
	return file;
}

const SUMMARY_ROWS = 5;

export function printBuildProfileSummary(
	report: BuildProfileReport,
	file: string,
	logger: AstroLogger,
) {
	const lines: string[] = [colors.bold('Build profile')];
	const share = (ms: number) => `${Math.round((ms / report.totalMs) * 100)}%`.padStart(4);
	const time = (ms: number) => getTimeStat(0, ms).padStart(8);

	lines.push('  Phases');
	for (const phase of report.phases) {
		lines.push(`    ${time(phase.durationMs)} ${share(phase.durationMs)}  ${phase.name}`);
	}

	if (report.routes.length) {
		const { concurrency } = report.environment;
		const overlap = concurrency > 1 ? `, concurrency ${concurrency}: page times overlap` : '';
		lines.push(`  Slowest routes (total render time${overlap})`);
		for (const r of report.routes.slice(0, SUMMARY_ROWS)) {
			const details = [];
			if (r.rendered) details.push(`${r.rendered} rendered`);
			if (r.cached) details.push(`${r.cached} cached`);
			if (r.rendered) {
				details.push(`avg ${getTimeStat(0, r.avgMs)}`, `max ${getTimeStat(0, r.maxMs)}`);
			}
			lines.push(`    ${time(r.totalMs)}  ${r.route} ${colors.dim(`(${details.join(', ')})`)}`);
		}
	}

	// Hooks such as `astro:routes:resolved` can run more than once per build.
	const hookTotals = new Map<string, HookEntry>();
	for (const h of report.hooks) {
		const key = `${h.integration}\0${h.hook}`;
		const total = hookTotals.get(key);
		if (total) total.durationMs += h.durationMs;
		else hookTotals.set(key, { ...h });
	}
	const hooks = [...hookTotals.values()]
		.filter((h) => h.durationMs >= 1)
		.sort((a, b) => b.durationMs - a.durationMs)
		.slice(0, SUMMARY_ROWS);
	if (hooks.length) {
		lines.push('  Slowest integration hooks');
		for (const h of hooks) {
			lines.push(`    ${time(h.durationMs)}  ${h.integration} ${colors.dim(h.hook)}`);
		}
	}

	lines.push(`  Full report: ${colors.cyan(file)}`);
	logger.info('build', lines.join('\n'));
}
