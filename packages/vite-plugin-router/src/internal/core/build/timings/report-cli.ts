import colors from 'piccolore';
import { ACTIVITY_BUCKETS } from './collector.js';
import type { BuildTimingsData, TimingSpan, WallStat } from './collector.js';

const NAME_WIDTH = 34;
const LEVELS = '▁▂▃▄▅▆▇█';

type Truncate = 'head' | 'tail';

interface Row {
	name: string;
	duration: number;
	/** Omitted for rows that overlap one another, whose shares would not add up to anything. */
	share?: number;
	/** Paths keep their tail, where the filename is; names keep their head. */
	keep?: Truncate;
	strip?: string;
	detail?: string;
}

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

function percent(value: number, total: number | undefined): string {
	if (total === undefined) return '      ';
	if (!total) return '  0.0%';
	return `${((value / total) * 100).toFixed(1).padStart(5)}%`;
}

function level(busy: number): string {
	if (busy <= 0.01) return colors.dim('·');
	return colors.blue(LEVELS[Math.min(LEVELS.length - 1, Math.ceil(busy * LEVELS.length) - 1)]);
}

function activityStrip(activity: number[]): string {
	// Brief work would otherwise round to an empty strip, so its busiest slot is always drawn.
	const busiest = activity.indexOf(Math.max(...activity));
	return activity
		.map((busy, slot) => level(busy > 0 && slot === busiest ? Math.max(busy, 0.02) : busy))
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

function truncate(text: string, width: number, keep: Truncate): string {
	if (text.length <= width) return text.padEnd(width);
	return keep === 'tail'
		? `…${text.slice(text.length - width + 1)}`
		: `${text.slice(0, width - 1)}…`;
}

function formatRow({ name, duration, share, keep = 'head', strip, detail }: Row): string {
	const columns = [
		'  ',
		truncate(name, NAME_WIDTH, keep),
		formatDuration(duration).padStart(8),
		' ',
		percent(duration, share),
	];
	if (strip) columns.push(' ', strip);
	if (detail) columns.push('  ', colors.dim(detail));
	return columns.join('').trimEnd();
}

function formatRows(rows: Row[], limit: number): string[] {
	return rows
		.filter((row) => Math.round(row.duration) > 0)
		.slice(0, limit)
		.map(formatRow);
}

function breakdown(stats: WallStat[], limit: number): string {
	return stats
		.filter((stat) => Math.round(stat.total) > 0)
		.slice(0, limit)
		.map((stat) => `${stat.name} ${formatDuration(stat.total)}`)
		.join(' · ');
}

function relativeToRoot(path: string, root: string): string {
	// Rolldown prefixes virtual modules with a NUL byte, which terminals render as junk.
	if (path.startsWith('\0')) return `${path.slice(1)} (astro internal)`;
	const dependency = path.lastIndexOf('/node_modules/');
	if (dependency !== -1) return path.slice(dependency + '/node_modules/'.length);
	if (path.startsWith(root)) return path.slice(root.length);
	return path;
}

function pushSection(
	lines: string[],
	title: string,
	subtitle: string | null,
	body: string[],
): void {
	if (!body.length) return;
	const heading = subtitle ? `${colors.bold(title)} ${colors.dim(subtitle)}` : colors.bold(title);
	lines.push(`\n${heading}`, ...body);
}

function spanTree(spans: TimingSpan[], total: number): string[] {
	const childrenOf = Map.groupBy(spans, (span) => span.parentId);
	const lines: string[] = [];
	const walk = (parentId: number | null, depth: number) => {
		for (const span of childrenOf.get(parentId) ?? []) {
			if (Math.round(span.duration) > 0) {
				lines.push(
					formatRow({
						name: `${'  '.repeat(depth)}${span.name}`,
						duration: span.duration,
						share: total,
						strip: spanStrip(span, total),
					}),
				);
			}
			walk(span.id, depth + 1);
		}
	};
	walk(null, 0);
	return lines;
}

export function renderCliReport(data: BuildTimingsData): string {
	const { root, totalDuration: total } = data;
	const matters = (duration: number) => duration >= total * 0.01;
	const lines: string[] = [];

	lines.push(`\n${colors.bgBlue(colors.black(' build timings '))}`);
	lines.push(
		colors.dim(
			[
				`total ${colors.bold(formatDuration(total))}`,
				plural(data.pages.count, 'page'),
				`output "${data.output}"`,
			].join(' · '),
		),
	);

	pushSection(lines, 'Build phases', null, spanTree(data.spans, total));

	pushSection(
		lines,
		'Vite plugins',
		`(${formatDuration(data.plugins.wallDuration)} of the build)`,
		formatRows(
			data.plugins.entries.map((plugin) => ({
				name: plugin.name,
				duration: plugin.total,
				strip: activityStrip(plugin.activity),
				detail: `${plural(plugin.calls, 'call')} · ${breakdown(plugin.children, 3)}`,
			})),
			8,
		),
	);

	pushSection(
		lines,
		'Markdown plugins',
		`(${formatDuration(data.markdown.wallDuration)} across ${plural(data.markdown.files, 'file')})`,
		formatRows(
			data.markdown.plugins.map((plugin) => ({
				name: plugin.name,
				duration: plugin.total,
				strip: activityStrip(plugin.activity),
				detail: `${plural(plugin.calls, 'call')}${plugin.pipeline === 'mdx' ? ' · MDX' : ''}`,
			})),
			8,
		),
	);

	pushSection(
		lines,
		'Syntax highlighting',
		`(${formatDuration(data.highlight.wallDuration)} across ${plural(data.highlight.blocks, 'code block')})`,
		formatRows(
			data.highlight.entries.map((language) => ({
				name: language.name,
				duration: language.total,
				strip: activityStrip(language.activity),
				detail: plural(language.calls, 'block'),
			})),
			8,
		),
	);

	pushSection(
		lines,
		'Slowest files to bundle',
		`(${formatDuration(data.modules.wallDuration)} in load/transform)`,
		formatRows(
			data.modules.entries.map((module) => ({
				name: relativeToRoot(module.name, root),
				duration: module.total,
				keep: 'tail',
				strip: activityStrip(module.activity),
				detail: breakdown(module.children, 2),
			})),
			8,
		),
	);

	if (matters(data.compiler.wallDuration)) {
		pushSection(
			lines,
			'Astro compiler',
			`(${plural(data.compiler.count, 'component')}, ${formatDuration(data.compiler.wallDuration)})`,
			formatRows(
				data.compiler.entries.map((file) => ({
					name: relativeToRoot(file.name, root),
					duration: file.duration,
					keep: 'tail',
				})),
				5,
			),
		);
	}

	if (data.pages.renderDuration) {
		pushSection(
			lines,
			'Page rendering',
			`(${formatDuration(data.pages.wallDuration)} across ${plural(data.pages.count, 'page')})`,
			[
				formatRow({
					name: 'component render',
					duration: data.pages.renderDuration,
					share: total,
					strip: activityStrip(data.pages.renderActivity),
				}),
				formatRow({
					name: 'page pipeline',
					duration: Math.max(data.pages.wallDuration - data.pages.renderDuration, 0),
					share: total,
				}),
			],
		);
	}

	const cachedPages = data.pages.cached ? ` · ${formatCount(data.pages.cached)} from cache` : '';
	pushSection(
		lines,
		'Slowest pages',
		`(median ${formatDuration(data.pages.median)} · p95 ${formatDuration(data.pages.p95)}${cachedPages})`,
		formatRows(
			data.pages.entries.map((page) => ({
				name: page.name,
				duration: page.duration,
				keep: 'tail',
				detail: page.cached ? 'cached' : page.route === page.name ? '' : page.route,
			})),
			8,
		),
	);

	if (matters(data.images.wallDuration)) {
		const cachedImages = data.images.cached
			? `, ${formatCount(data.images.cached)} from cache`
			: '';
		pushSection(
			lines,
			'Images',
			`(${plural(data.images.count, 'transform')}, ${formatDuration(data.images.wallDuration)}${cachedImages})`,
			formatRows(
				data.images.entries.map((image) => ({
					name: relativeToRoot(image.name, root),
					duration: image.duration,
					keep: 'tail',
				})),
				5,
			),
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
			formatRows(
				data.integrations.map((integration) => ({
					name: integration.name,
					duration: integration.total,
					share: total,
					strip: activityStrip(integration.activity),
					detail: breakdown(integration.children, 3),
				})),
				8,
			),
		);
	}

	return `${lines.join('\n')}\n`;
}
