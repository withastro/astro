import colors from 'piccolore';
import { ACTIVITY_BUCKETS } from './collector.js';
import type { BuildTimingsData, SerializedCallStat, TimingSpan } from './collector.js';

const NAME_WIDTH = 34;

function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
	return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatCount(value: number): string {
	return value.toLocaleString('en-US');
}

function plural(count: number, noun: string): string {
	return `${formatCount(count)} ${noun}${count === 1 ? '' : 's'}`;
}

// Overlapping rows pass `null`: no denominator makes them add up to anything.
function percent(value: number, total: number | null): string {
	if (total === null) return '      ';
	if (!total) return '  0.0%';
	return `${((value / total) * 100).toFixed(1).padStart(5)}%`;
}

const LEVELS = '▁▂▃▄▅▆▇█';

function level(busy: number): string {
	if (busy <= 0.01) return colors.dim('·');
	return colors.blue(LEVELS[Math.min(LEVELS.length - 1, Math.ceil(busy * LEVELS.length) - 1)]);
}

/** When a row was busy, so two rows lighting the same columns *is* the overlap. */
function activityStrip(activity: number[]): string {
	const busiest = activity.indexOf(Math.max(...activity));
	return activity
		.map((busy, slot) => (busy > 0 && slot === busiest ? level(Math.max(busy, 0.02)) : level(busy)))
		.join('');
}

function spanStrip(span: TimingSpan, window: number): string {
	const width = window / ACTIVITY_BUCKETS;
	return Array.from({ length: ACTIVITY_BUCKETS }, (_, slot) => {
		const overlap =
			Math.min(span.start + span.duration, (slot + 1) * width) - Math.max(span.start, slot * width);
		return level(Math.max(overlap, 0) / width);
	}).join('');
}

// Paths keep their tail, where the filename is; names keep their head, where the identity is.
function pad(text: string, width: number, keep: 'head' | 'tail' = 'head'): string {
	if (text.length <= width) return text.padEnd(width);
	const truncated =
		keep === 'tail' ? `…${text.slice(text.length - width + 1)}` : `${text.slice(0, width - 1)}…`;
	return truncated.padEnd(width);
}

function heading(title: string, subtitle?: string): string {
	const suffix = subtitle ? ` ${colors.dim(subtitle)}` : '';
	return `\n${colors.bold(title)}${suffix}`;
}

function statRow(
	name: string,
	duration: number,
	share: number | null,
	detail?: string,
	keep: 'head' | 'tail' = 'head',
	strip?: string,
): string {
	const columns = [
		'  ',
		pad(name, NAME_WIDTH, keep),
		formatDuration(duration).padStart(8),
		' ',
		percent(duration, share),
	];
	// Sections without strips close the gap rather than leaving a dead gutter.
	if (strip) columns.push(' ', strip);
	if (detail) columns.push('  ', colors.dim(detail));
	return columns.join('');
}

function hookSummary(hooks: SerializedCallStat[]): string {
	return hooks
		.filter((hook) => Math.round(hook.total) > 0)
		.slice(0, 3)
		.map((hook) => `${hook.name} ${formatDuration(hook.total)}`)
		.join(' · ');
}

function relativeToRoot(path: string, root: string): string {
	// Rolldown prefixes virtual modules with a NUL byte, which the terminal renders as junk.
	if (path.startsWith('\0')) return `${path.slice(1)} (astro internal)`;
	const dependency = path.lastIndexOf('/node_modules/');
	if (dependency !== -1) return path.slice(dependency + '/node_modules/'.length);
	if (path.startsWith(root)) return path.slice(root.length);
	return path;
}

interface RowsOptions<T> {
	label: (entry: T) => string;
	value: (entry: T) => number;
	share: number | null;
	limit: number;
	keep?: 'head' | 'tail';
	detail?: (entry: T) => string;
	strip?: (entry: T) => string;
}

function rows<T>(entries: T[], options: RowsOptions<T>): string[] {
	// Bars scale to the section, so a row rounding to 0ms would still draw a full-width bar.
	const shown = entries.filter((entry) => Math.round(options.value(entry)) > 0);
	return shown
		.slice(0, options.limit)
		.map((entry) =>
			statRow(
				options.label(entry),
				options.value(entry),
				options.share,
				options.detail?.(entry),
				options.keep,
				options.strip?.(entry),
			),
		);
}

/** Culling rows can empty a section, and a heading with nothing under it reads as a bug. */
function pushSection(lines: string[], title: string, subtitle: string, body: string[]): void {
	if (!body.length) return;
	lines.push(heading(title, subtitle), ...body);
}

function spanTree(spans: TimingSpan[], total: number): string[] {
	const lines: string[] = [];
	const childrenOf = new Map<number | null, TimingSpan[]>();
	for (const span of spans) {
		const siblings = childrenOf.get(span.parentId) ?? [];
		siblings.push(span);
		childrenOf.set(span.parentId, siblings);
	}

	const walk = (parentId: number | null, depth: number) => {
		for (const span of childrenOf.get(parentId) ?? []) {
			// A phase that rounds to nothing is noise; its children may still be worth showing.
			if (Math.round(span.duration) > 0) {
				lines.push(
					statRow(
						`${'  '.repeat(depth)}${span.name}`,
						span.duration,
						total,
						undefined,
						'head',
						spanStrip(span, total),
					),
				);
			}
			walk(span.id, depth + 1);
		}
	};
	walk(null, 0);

	return lines;
}

export function renderCliReport(data: BuildTimingsData): string {
	const lines: string[] = [];
	const total = data.totalDuration;
	// A section that cannot move the build is noise; the HTML report still carries it.
	const matters = (duration: number) => duration >= total * 0.01;

	lines.push(`\n${colors.bgBlue(colors.black(' build timings '))}`);
	const summary = [
		`total ${colors.bold(formatDuration(total))}`,
		`${formatCount(data.pages.total)} pages`,
		`${formatCount(data.modules.total)} modules`,
	];
	if (data.output) summary.push(`output "${data.output}"`);
	lines.push(colors.dim(summary.join(' \u00b7 ')));
	lines.push(
		colors.dim('Wall clock, not CPU time \u00b7 strips span the whole build, left to right'),
	);

	if (data.spans.length) {
		lines.push(heading('Build phases'));
		lines.push(...spanTree(data.spans, total));
	}

	pushSection(
		lines,
		'Vite plugins',
		`(${formatDuration(data.plugins.wallDuration)} of the build \u00b7 when each was busy)`,
		rows(data.plugins.entries, {
			label: (plugin) => plugin.name,
			value: (plugin) => plugin.total,
			share: null,
			limit: 8,
			detail: (plugin) => `${plural(plugin.calls, 'call')} \u00b7 ${hookSummary(plugin.hooks)}`,
			strip: (plugin) => activityStrip(plugin.activity),
		}),
	);

	pushSection(
		lines,
		'Markdown plugins',
		`(${formatDuration(data.markdown.files.wallDuration)} across ${plural(data.markdown.files.total, 'file')})`,
		data.markdown.plugins.length
			? rows(data.markdown.plugins, {
					label: (plugin) => plugin.name,
					value: (plugin) => plugin.total,
					share: null,
					limit: 8,
					detail: (plugin) => plural(plugin.calls, 'run'),
					strip: (plugin) => activityStrip(plugin.activity),
				})
			: rows(data.markdown.files.entries, {
					label: (file) => relativeToRoot(file.path, data.root),
					value: (file) => file.duration,
					share: null,
					limit: 5,
					keep: 'tail',
				}),
	);

	pushSection(
		lines,
		'Syntax highlighting',
		`(${formatDuration(data.highlight.wallDuration)} across ${plural(data.highlight.blocks, 'code block')})`,
		rows(data.highlight.languages, {
			label: (language) => language.name,
			value: (language) => language.total,
			share: total,
			limit: 8,
			detail: (language) => plural(language.calls, 'block'),
			strip: (language) => activityStrip(language.activity),
		}),
	);

	pushSection(
		lines,
		'Slowest files to bundle',
		`(${formatDuration(data.modules.wallDuration)} in load/transform \u00b7 when each was busy)`,
		rows(data.modules.entries, {
			label: (module) => relativeToRoot(module.name, data.root),
			value: (module) => module.total,
			share: null,
			limit: 8,
			keep: 'tail',
			strip: (module) => activityStrip(module.activity),
			detail: (module) =>
				module.plugins
					.filter((plugin) => Math.round(plugin.total) > 0)
					.slice(0, 2)
					.map((plugin) => `${plugin.name} ${formatDuration(plugin.total)}`)
					.join(' \u00b7 '),
		}),
	);

	if (matters(data.compiler.wallDuration)) {
		pushSection(
			lines,
			'Astro compiler',
			`(${plural(data.compiler.total, 'component')}, ${formatDuration(data.compiler.wallDuration)})`,
			rows(data.compiler.entries, {
				label: (file) => relativeToRoot(file.path, data.root),
				value: (file) => file.duration,
				share: total,
				limit: 5,
				keep: 'tail',
			}),
		);
	}

	if (data.pages.componentDuration) {
		const pipeline = Math.max(data.pages.wallDuration - data.pages.componentDuration, 0);
		pushSection(
			lines,
			'Page rendering',
			`(${formatDuration(data.pages.wallDuration)} across ${plural(data.pages.total, 'page')})`,
			[
				statRow(
					'component render',
					data.pages.componentDuration,
					total,
					undefined,
					'head',
					activityStrip(data.pages.componentActivity),
				),
				statRow('page pipeline', pipeline, total),
			],
		);
	}

	pushSection(
		lines,
		'Slowest pages',
		`(median ${formatDuration(data.pages.median)} \u00b7 p95 ${formatDuration(data.pages.p95)}${data.pages.cached ? ` \u00b7 ${formatCount(data.pages.cached)} from cache` : ''})`,
		rows(data.pages.entries, {
			label: (page) => page.pathname,
			value: (page) => page.duration,
			share: total,
			limit: 8,
			keep: 'tail',
			detail: (page) => (page.cached ? 'cached' : page.route === page.pathname ? '' : page.route),
		}),
	);

	if (matters(data.images.wallDuration)) {
		pushSection(
			lines,
			'Images',
			`(${plural(data.images.total, 'transform')}, ${formatDuration(data.images.wallDuration)}${data.images.cached ? `, ${formatCount(data.images.cached)} from cache` : ''})`,
			rows(data.images.entries, {
				label: (image) => relativeToRoot(image.path, data.root),
				value: (image) => image.duration,
				share: total,
				limit: 5,
				keep: 'tail',
			}),
		);
	}

	const integrationTotal = data.integrations.reduce(
		(sum, integration) => sum + integration.total,
		0,
	);
	if (matters(integrationTotal)) {
		pushSection(
			lines,
			'Integrations',
			`(${formatDuration(integrationTotal)} in hooks)`,
			rows(data.integrations, {
				label: (integration) => integration.name,
				value: (integration) => integration.total,
				share: total,
				limit: 8,
				detail: (integration) => hookSummary(integration.hooks),
				strip: (integration) => activityStrip(integration.activity),
			}),
		);
	}

	return `${lines.join('\n')}\n`;
}
