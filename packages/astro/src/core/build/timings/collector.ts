import { AsyncLocalStorage } from 'node:async_hooks';
import type { BuildTimingsRecorder } from '@astrojs/internal-helpers/timings';

export const ACTIVITY_BUCKETS = 22;

// Comfortably more than the report prints, so the cap never decides what is shown.
const MAX_ROWS = 50;

export interface TimingSpan {
	id: number;
	parentId: number | null;
	name: string;
	start: number;
	duration: number;
}

export interface WallStat {
	name: string;
	/** Wall-clock time, with overlapping calls counted once. */
	total: number;
	calls: number;
	/** Busy fraction for each equal slice of the build. */
	activity: number[];
}

interface GroupedWallStat extends WallStat {
	children: WallStat[];
}

interface DurationRecord {
	name: string;
	duration: number;
}

interface PageRecord extends DurationRecord {
	route: string;
	cached: boolean;
}

interface ImageRecord extends DurationRecord {
	cached: boolean;
}

interface TimingsSection<T> {
	entries: T[];
	count: number;
	/** Wall-clock time spent in this section, with overlapping work counted once. */
	wallDuration: number;
}

export interface BuildTimingsData {
	root: string;
	output: string;
	totalDuration: number;
	spans: TimingSpan[];
	/** Children are the plugin's hooks. */
	plugins: TimingsSection<GroupedWallStat>;
	/** Children are the plugins that loaded or transformed the module. */
	modules: TimingsSection<GroupedWallStat>;
	/** Children are the integration's hooks. */
	integrations: GroupedWallStat[];
	pages: TimingsSection<PageRecord> & {
		cached: number;
		median: number;
		p95: number;
		/** Time inside the prerenderer, as opposed to the pipeline that writes its output. */
		renderDuration: number;
		renderActivity: number[];
	};
	images: TimingsSection<ImageRecord> & { cached: number };
	markdown: {
		plugins: (WallStat & { pipeline: 'markdown' | 'mdx' })[];
		files: number;
		wallDuration: number;
	};
	highlight: TimingsSection<WallStat> & { blocks: number };
	compiler: TimingsSection<DurationRecord>;
}

interface BuildContext {
	root: string;
	output: string;
}

/** Wall-clock time covered by possibly overlapping intervals, which summing would count twice. */
class IntervalUnion {
	private readonly intervals: Array<[number, number]> = [];

	add(start: number, end: number): void {
		this.intervals.push([start, end]);
	}

	private merged(): Array<[number, number]> {
		const sorted = [...this.intervals].sort((a, b) => a[0] - b[0]);
		const merged: Array<[number, number]> = [];
		for (const [start, end] of sorted) {
			const last = merged.at(-1);
			if (last && start <= last[1]) {
				last[1] = Math.max(last[1], end);
			} else {
				merged.push([start, end]);
			}
		}
		return merged;
	}

	get duration(): number {
		return this.merged().reduce((total, [start, end]) => total + (end - start), 0);
	}

	activity(window: number): number[] {
		const slots = new Array<number>(ACTIVITY_BUCKETS).fill(0);
		const width = window / ACTIVITY_BUCKETS;
		if (width <= 0) return slots;

		for (const [start, end] of this.merged()) {
			const first = Math.max(0, Math.floor(start / width));
			const last = Math.min(ACTIVITY_BUCKETS - 1, Math.floor(end / width));
			for (let slot = first; slot <= last; slot++) {
				const overlap = Math.min(end, (slot + 1) * width) - Math.max(start, slot * width);
				if (overlap > 0) slots[slot] += overlap / width;
			}
		}
		return slots.map((value) => Math.min(value, 1));
	}
}

class Tally {
	calls = 0;
	readonly wall = new IntervalUnion();

	add(start: number, end: number): void {
		this.calls++;
		this.wall.add(start, end);
	}

	toStat(name: string, window: number): WallStat {
		return {
			name,
			total: this.wall.duration,
			calls: this.calls,
			activity: this.wall.activity(window),
		};
	}
}

class GroupedTally extends Tally {
	readonly children = new Map<string, Tally>();

	addChild(child: string, start: number, end: number): void {
		this.add(start, end);
		tallyOf(this.children, child, Tally).add(start, end);
	}

	toGroupedStat(name: string, window: number): GroupedWallStat {
		return { ...this.toStat(name, window), children: toSortedStats(this.children, window) };
	}
}

function tallyOf<T extends Tally>(map: Map<string, T>, key: string, Kind: new () => T): T {
	let tally = map.get(key);
	if (!tally) {
		tally = new Kind();
		map.set(key, tally);
	}
	return tally;
}

function toSortedStats(map: Map<string, Tally>, window: number): WallStat[] {
	return [...map]
		.map(([name, tally]) => tally.toStat(name, window))
		.sort((a, b) => b.total - a.total);
}

function toSortedGroupedStats(map: Map<string, GroupedTally>, window: number): GroupedWallStat[] {
	return [...map]
		.map(([name, tally]) => tally.toGroupedStat(name, window))
		.sort((a, b) => b.total - a.total);
}

function section<T>(entries: T[], wall: IntervalUnion): TimingsSection<T> {
	return {
		entries: entries.slice(0, MAX_ROWS),
		count: entries.length,
		wallDuration: wall.duration,
	};
}

function byDuration<T extends DurationRecord>(records: T[]): T[] {
	return [...records].sort((a, b) => b.duration - a.duration);
}

function percentile(sorted: number[], fraction: number): number {
	if (sorted.length === 0) return 0;
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

export class BuildTimingsCollector implements BuildTimingsRecorder {
	private readonly origin = performance.now();
	private readonly spans: TimingSpan[] = [];
	private readonly currentSpan = new AsyncLocalStorage<number>();

	private readonly plugins = new Map<string, GroupedTally>();
	private readonly modules = new Map<string, GroupedTally>();
	private readonly integrations = new Map<string, GroupedTally>();
	private readonly markdownPlugins = new Map<string, Tally>();
	private readonly mdxPlugins = new Map<string, Tally>();
	private readonly languages = new Map<string, Tally>();
	private readonly pages: PageRecord[] = [];
	private readonly images: ImageRecord[] = [];
	private readonly compiledFiles: DurationRecord[] = [];
	private markdownFiles = 0;

	private readonly pluginWall = new IntervalUnion();
	private readonly moduleWall = new IntervalUnion();
	private readonly pageWall = new IntervalUnion();
	private readonly pageRenderWall = new IntervalUnion();
	private readonly imageWall = new IntervalUnion();
	private readonly markdownWall = new IntervalUnion();
	private readonly compilerWall = new IntervalUnion();
	private readonly highlightWall = new IntervalUnion();

	async span<T>(name: string, fn: () => Promise<T>): Promise<T> {
		const span: TimingSpan = {
			id: this.spans.length,
			parentId: this.currentSpan.getStore() ?? null,
			name,
			start: performance.now() - this.origin,
			duration: 0,
		};
		this.spans.push(span);
		try {
			return await this.currentSpan.run(span.id, fn);
		} finally {
			span.duration = performance.now() - this.origin - span.start;
		}
	}

	record(kind: string, name: string, duration: number, meta?: Record<string, any>): void {
		const end = performance.now() - this.origin;
		const start = end - duration;

		switch (kind) {
			case 'vite-hook':
				this.pluginWall.add(start, end);
				tallyOf(this.plugins, name, GroupedTally).addChild(meta?.hook, start, end);
				if (meta?.module) {
					this.moduleWall.add(start, end);
					tallyOf(this.modules, meta.module, GroupedTally).addChild(name, start, end);
				}
				break;
			case 'integration':
				tallyOf(this.integrations, name, GroupedTally).addChild(meta?.hook, start, end);
				break;
			case 'page':
				this.pageWall.add(start, end);
				this.pages.push({ name, route: meta?.route, duration, cached: Boolean(meta?.cached) });
				break;
			case 'page-render':
				this.pageRenderWall.add(start, end);
				break;
			case 'image':
				this.imageWall.add(start, end);
				this.images.push({ name, duration, cached: Boolean(meta?.cached) });
				break;
			case 'markdown-plugin':
				tallyOf(this.markdownPlugins, name, Tally).add(start, end);
				break;
			case 'mdx-plugin':
				tallyOf(this.mdxPlugins, name, Tally).add(start, end);
				break;
			case 'markdown-file':
				this.markdownWall.add(start, end);
				this.markdownFiles++;
				break;
			case 'highlight':
				this.highlightWall.add(start, end);
				tallyOf(this.languages, name, Tally).add(start, end);
				break;
			case 'astro-compile':
				this.compilerWall.add(start, end);
				this.compiledFiles.push({ name, duration });
				break;
		}
	}

	toData(context: BuildContext): BuildTimingsData {
		const window = performance.now() - this.origin;
		const sortedPageDurations = this.pages.map((page) => page.duration).sort((a, b) => a - b);
		const languages = toSortedStats(this.languages, window);

		return {
			...context,
			totalDuration: window,
			spans: this.spans,
			plugins: section(toSortedGroupedStats(this.plugins, window), this.pluginWall),
			modules: section(toSortedGroupedStats(this.modules, window), this.moduleWall),
			integrations: toSortedGroupedStats(this.integrations, window),
			pages: {
				...section(byDuration(this.pages), this.pageWall),
				cached: this.pages.filter((page) => page.cached).length,
				median: percentile(sortedPageDurations, 0.5),
				p95: percentile(sortedPageDurations, 0.95),
				renderDuration: this.pageRenderWall.duration,
				renderActivity: this.pageRenderWall.activity(window),
			},
			images: {
				...section(byDuration(this.images), this.imageWall),
				cached: this.images.filter((image) => image.cached).length,
			},
			markdown: {
				plugins: [
					...toSortedStats(this.markdownPlugins, window).map((stat) => ({
						...stat,
						pipeline: 'markdown' as const,
					})),
					...toSortedStats(this.mdxPlugins, window).map((stat) => ({
						...stat,
						pipeline: 'mdx' as const,
					})),
				].sort((a, b) => b.total - a.total),
				files: this.markdownFiles,
				wallDuration: this.markdownWall.duration,
			},
			highlight: {
				...section(languages, this.highlightWall),
				blocks: languages.reduce((sum, language) => sum + language.calls, 0),
			},
			compiler: section(byDuration(this.compiledFiles), this.compilerWall),
		};
	}
}
