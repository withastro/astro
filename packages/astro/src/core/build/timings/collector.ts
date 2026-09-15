import { fileURLToPath } from 'node:url';
import type { BuildTimingsRecorder } from '@astrojs/internal-helpers/timings';

export type SpanCategory = 'setup' | 'bundle' | 'generate' | 'assets' | 'finalize';

/** Columns in a row's activity strip; the report renders one character per bucket. */
export const ACTIVITY_BUCKETS = 22;

export interface TimingSpan {
	id: number;
	parentId: number | null;
	name: string;
	category: SpanCategory;
	start: number;
	duration: number;
}

interface CallStat {
	total: number;
	calls: number;
}

interface WallCallStat extends CallStat {
	wall: IntervalUnion;
}

interface PluginStat extends WallCallStat {
	hooks: Map<string, WallCallStat>;
}

interface ModuleStat extends CallStat {
	plugins: Map<string, CallStat>;
	wall: IntervalUnion;
}

interface PageRecord {
	pathname: string;
	route: string;
	duration: number;
	cached: boolean;
}

interface FileRecord {
	path: string;
	duration: number;
}

interface ImageRecord {
	path: string;
	duration: number;
	cached: boolean;
}

interface LanguageStat extends CallStat {
	chars: number;
	wall: IntervalUnion;
}

export interface SerializedCallStat {
	name: string;
	total: number;
	calls: number;
}

export interface SerializedWallStat extends SerializedCallStat {
	/** Summed across calls, so concurrent work is counted more than once. */
	work: number;
	/** Busy fraction per slice of the build, so overlap between rows is visible. */
	activity: number[];
}

export interface SerializedPlugin extends SerializedWallStat {
	hooks: SerializedWallStat[];
}

export interface SerializedModule extends SerializedCallStat {
	activity: number[];
	plugins: SerializedCallStat[];
}

export interface TimingsSection<T> {
	entries: T[];
	total: number;
	/** Summed measurements: comparable between entries, inflated by concurrency. */
	totalDuration: number;
	/** Wall-clock time the build spent here, with overlapping work counted once. */
	wallDuration: number;
}

export interface BuildTimingsData {
	root: string;
	output: string;
	totalDuration: number;
	spans: TimingSpan[];
	plugins: TimingsSection<SerializedPlugin>;
	modules: TimingsSection<SerializedModule>;
	pages: TimingsSection<PageRecord> & {
		rendered: number;
		cached: number;
		median: number;
		p95: number;
		/** Inside the prerenderer: page components, integrations and Astro's renderer. */
		componentDuration: number;
		componentActivity: number[];
	};
	images: TimingsSection<ImageRecord> & { cached: number };
	integrations: SerializedPlugin[];
	markdown: {
		plugins: (SerializedWallStat & { pipeline: 'markdown' | 'mdx' })[];
		files: TimingsSection<FileRecord>;
	};
	highlight: {
		totalDuration: number;
		wallDuration: number;
		blocks: number;
		languages: (SerializedWallStat & { chars: number })[];
	};
	compiler: TimingsSection<FileRecord>;
}

// Comfortably more than the report prints, so the cap never decides what is shown.
const MAX_ROWS = 50;

function bumpWall(
	map: Map<string, WallCallStat>,
	key: string,
	duration: number,
	start: number,
	end: number,
): WallCallStat {
	let stat = map.get(key);
	if (!stat) {
		stat = { total: 0, calls: 0, wall: new IntervalUnion() };
		map.set(key, stat);
	}
	stat.total += duration;
	stat.calls++;
	stat.wall.add(start, end);
	return stat;
}

function toSortedWallStats(map: Map<string, WallCallStat>, window: number): SerializedWallStat[] {
	return [...map]
		.map(([name, stat]) => ({
			name,
			total: stat.wall.duration,
			work: stat.total,
			calls: stat.calls,
			activity: stat.wall.activity(ACTIVITY_BUCKETS, window),
		}))
		.sort((a, b) => b.total - a.total);
}

function bump(map: Map<string, CallStat>, key: string, duration: number): CallStat {
	let stat = map.get(key);
	if (!stat) {
		stat = { total: 0, calls: 0 };
		map.set(key, stat);
	}
	stat.total += duration;
	stat.calls++;
	return stat;
}

function toSortedStats(map: Map<string, CallStat>): SerializedCallStat[] {
	return [...map]
		.map(([name, stat]) => ({ name, total: stat.total, calls: stat.calls }))
		.sort((a, b) => b.total - a.total);
}

/** Wall-clock time covered by overlapping measurements, which summing would count twice. */
class IntervalUnion {
	private readonly bounds: number[] = [];

	add(start: number, end: number): void {
		this.bounds.push(start, end);
	}

	private merged(): Array<[number, number]> {
		if (this.bounds.length === 0) return [];

		const intervals: Array<[number, number]> = [];
		for (let i = 0; i < this.bounds.length; i += 2) {
			intervals.push([this.bounds[i], this.bounds[i + 1]]);
		}
		intervals.sort((a, b) => a[0] - b[0]);

		const merged: Array<[number, number]> = [];
		let [start, end] = intervals[0];
		for (const [nextStart, nextEnd] of intervals.slice(1)) {
			if (nextStart > end) {
				merged.push([start, end]);
				start = nextStart;
				end = nextEnd;
			} else if (nextEnd > end) {
				end = nextEnd;
			}
		}
		merged.push([start, end]);
		return merged;
	}

	get duration(): number {
		return this.merged().reduce((total, [start, end]) => total + (end - start), 0);
	}

	/** Fraction of each equal slice of the build during which this was busy. */
	activity(buckets: number, window: number): number[] {
		const slots = new Array<number>(buckets).fill(0);
		const width = window / buckets;
		if (width <= 0) return slots;

		for (const [start, end] of this.merged()) {
			const first = Math.max(0, Math.floor(start / width));
			const last = Math.min(buckets - 1, Math.floor(end / width));
			for (let slot = first; slot <= last; slot++) {
				const overlap = Math.min(end, (slot + 1) * width) - Math.max(start, slot * width);
				if (overlap > 0) slots[slot] += overlap / width;
			}
		}
		return slots.map((value) => Math.min(value, 1));
	}
}

function section<T>(
	entries: T[],
	durationOf: (entry: T) => number,
	wall: IntervalUnion,
): TimingsSection<T> {
	return {
		entries: entries.slice(0, MAX_ROWS),
		total: entries.length,
		totalDuration: entries.reduce((sum, entry) => sum + durationOf(entry), 0),
		wallDuration: wall.duration,
	};
}

/** Markdown renderers report the file they are given, which may be a `file://` URL. */
function toDisplayPath(value: string): string {
	if (!value.startsWith('file://')) return value;
	try {
		return fileURLToPath(value);
	} catch {
		return value;
	}
}

function percentile(sorted: number[], fraction: number): number {
	if (sorted.length === 0) return 0;
	const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction));
	return sorted[index];
}

export interface BuildContext {
	root: string;
	output: string;
}

export class BuildTimingsCollector implements BuildTimingsRecorder {
	private readonly origin = performance.now();
	private readonly spans: TimingSpan[] = [];
	private currentSpanId: number | null = null;
	private nextSpanId = 0;

	private readonly plugins = new Map<string, PluginStat>();
	private readonly modules = new Map<string, ModuleStat>();
	private readonly integrations = new Map<string, PluginStat>();
	private readonly markdownPlugins = new Map<string, WallCallStat>();
	private readonly mdxPlugins = new Map<string, WallCallStat>();
	private readonly languages = new Map<string, LanguageStat>();
	private readonly pages: PageRecord[] = [];
	private readonly images: ImageRecord[] = [];
	private readonly markdownFiles: FileRecord[] = [];
	private readonly compiledFiles: FileRecord[] = [];

	private readonly pluginWall = new IntervalUnion();
	private readonly moduleWall = new IntervalUnion();
	private readonly pageWall = new IntervalUnion();
	private readonly pageRenderWall = new IntervalUnion();
	private readonly imageWall = new IntervalUnion();
	private readonly markdownWall = new IntervalUnion();
	private readonly compilerWall = new IntervalUnion();
	private readonly highlightWall = new IntervalUnion();

	async span<T>(name: string, category: SpanCategory, fn: () => Promise<T>): Promise<T> {
		const span: TimingSpan = {
			id: this.nextSpanId++,
			parentId: this.currentSpanId,
			name,
			category,
			start: performance.now() - this.origin,
			duration: 0,
		};
		this.spans.push(span);
		const parentId = this.currentSpanId;
		this.currentSpanId = span.id;
		try {
			return await fn();
		} finally {
			span.duration = performance.now() - this.origin - span.start;
			this.currentSpanId = parentId;
		}
	}

	record(kind: string, name: string, duration: number, meta?: Record<string, any>): void {
		const end = performance.now() - this.origin;
		const start = end - duration;

		switch (kind) {
			case 'vite-hook': {
				this.pluginWall.add(start, end);
				let plugin = this.plugins.get(name);
				if (!plugin) {
					plugin = { total: 0, calls: 0, wall: new IntervalUnion(), hooks: new Map() };
					this.plugins.set(name, plugin);
				}
				plugin.total += duration;
				plugin.calls++;
				plugin.wall.add(start, end);
				bumpWall(plugin.hooks, meta?.hook ?? 'unknown', duration, start, end);

				const moduleId: string | undefined = meta?.module;
				if (moduleId) {
					this.moduleWall.add(start, end);
					let mod = this.modules.get(moduleId);
					if (!mod) {
						mod = { total: 0, calls: 0, plugins: new Map(), wall: new IntervalUnion() };
						this.modules.set(moduleId, mod);
					}
					mod.total += duration;
					mod.calls++;
					mod.wall.add(start, end);
					bump(mod.plugins, name, duration);
				}
				break;
			}
			case 'integration': {
				let integration = this.integrations.get(name);
				if (!integration) {
					integration = { total: 0, calls: 0, wall: new IntervalUnion(), hooks: new Map() };
					this.integrations.set(name, integration);
				}
				integration.total += duration;
				integration.calls++;
				integration.wall.add(start, end);
				bumpWall(integration.hooks, meta?.hook ?? 'unknown', duration, start, end);
				break;
			}
			case 'page':
				this.pageWall.add(start, end);
				this.pages.push({
					pathname: name,
					route: meta?.route ?? name,
					duration,
					cached: Boolean(meta?.cached),
				});
				break;
			case 'page-render':
				this.pageRenderWall.add(start, end);
				break;
			case 'image':
				this.imageWall.add(start, end);
				this.images.push({ path: name, duration, cached: Boolean(meta?.cached) });
				break;
			case 'markdown-plugin':
				bumpWall(this.markdownPlugins, name, duration, start, end);
				break;
			case 'mdx-plugin':
				bumpWall(this.mdxPlugins, name, duration, start, end);
				break;
			case 'markdown-file':
				this.markdownWall.add(start, end);
				this.markdownFiles.push({ path: toDisplayPath(name), duration });
				break;
			case 'highlight': {
				this.highlightWall.add(start, end);
				let language = this.languages.get(name);
				if (!language) {
					language = { total: 0, calls: 0, chars: 0, wall: new IntervalUnion() };
					this.languages.set(name, language);
				}
				language.total += duration;
				language.calls++;
				language.chars += meta?.chars ?? 0;
				language.wall.add(start, end);
				break;
			}
			case 'astro-compile':
				this.compilerWall.add(start, end);
				this.compiledFiles.push({ path: name, duration });
				break;
		}
	}

	toData(context: BuildContext): BuildTimingsData {
		const totalDuration = performance.now() - this.origin;
		const sortedPageDurations = this.pages.map((page) => page.duration).sort((a, b) => a - b);

		return {
			root: context.root,
			output: context.output,
			totalDuration,
			spans: this.spans,
			plugins: section(
				[...this.plugins]
					.map(([name, stat]) => ({
						name,
						total: stat.wall.duration,
						work: stat.total,
						calls: stat.calls,
						activity: stat.wall.activity(ACTIVITY_BUCKETS, totalDuration),
						hooks: toSortedWallStats(stat.hooks, totalDuration),
					}))
					.sort((a, b) => b.total - a.total),
				(plugin) => plugin.work,
				this.pluginWall,
			),
			modules: section(
				[...this.modules]
					.map(([name, stat]) => ({
						name,
						total: stat.total,
						calls: stat.calls,
						activity: stat.wall.activity(ACTIVITY_BUCKETS, totalDuration),
						plugins: toSortedStats(stat.plugins),
					}))
					.sort((a, b) => b.total - a.total),
				(module) => module.total,
				this.moduleWall,
			),
			pages: {
				...section(
					[...this.pages].sort((a, b) => b.duration - a.duration),
					(page) => page.duration,
					this.pageWall,
				),
				rendered: this.pages.filter((page) => !page.cached).length,
				cached: this.pages.filter((page) => page.cached).length,
				median: percentile(sortedPageDurations, 0.5),
				p95: percentile(sortedPageDurations, 0.95),
				componentDuration: this.pageRenderWall.duration,
				componentActivity: this.pageRenderWall.activity(ACTIVITY_BUCKETS, totalDuration),
			},
			images: {
				...section(
					[...this.images].sort((a, b) => b.duration - a.duration),
					(image) => image.duration,
					this.imageWall,
				),
				cached: this.images.filter((image) => image.cached).length,
			},
			integrations: [...this.integrations]
				.map(([name, stat]) => ({
					name,
					total: stat.wall.duration,
					work: stat.total,
					calls: stat.calls,
					activity: stat.wall.activity(ACTIVITY_BUCKETS, totalDuration),
					hooks: toSortedWallStats(stat.hooks, totalDuration),
				}))
				.sort((a, b) => b.total - a.total),
			markdown: {
				plugins: [
					...toSortedWallStats(this.markdownPlugins, totalDuration).map((stat) => ({
						...stat,
						pipeline: 'markdown' as const,
					})),
					...toSortedWallStats(this.mdxPlugins, totalDuration).map((stat) => ({
						...stat,
						pipeline: 'mdx' as const,
					})),
				].sort((a, b) => b.total - a.total),
				files: section(
					[...this.markdownFiles].sort((a, b) => b.duration - a.duration),
					(file) => file.duration,
					this.markdownWall,
				),
			},
			highlight: {
				totalDuration: [...this.languages.values()].reduce((sum, lang) => sum + lang.total, 0),
				wallDuration: this.highlightWall.duration,
				blocks: [...this.languages.values()].reduce((sum, lang) => sum + lang.calls, 0),
				languages: [...this.languages]
					.map(([name, stat]) => ({
						name,
						total: stat.wall.duration,
						work: stat.total,
						calls: stat.calls,
						activity: stat.wall.activity(ACTIVITY_BUCKETS, totalDuration),
						chars: stat.chars,
					}))
					.sort((a, b) => b.total - a.total),
			},
			compiler: section(
				[...this.compiledFiles].sort((a, b) => b.duration - a.duration),
				(file) => file.duration,
				this.compilerWall,
			),
		};
	}
}
