/**
 * Generates the Markdown build performance report from collected perf data.
 */

import type { ComponentPerfEntry, PagePerfEntry } from './perf-tracker.js';

function pct(value: number, total: number): string {
	if (total === 0) return '0.00%';
	return `${((value / total) * 100).toFixed(2)}%`;
}

function ms(value: number): string {
	return `${value.toFixed(2)}ms`;
}

function mdTable(headers: string[], rows: string[][]): string {
	const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
	const pad = (s: string, w: number) => s.padEnd(w);
	const sep = widths.map((w) => '-'.repeat(w));
	const fmt = (cols: string[]) => `| ${cols.map((c, i) => pad(c, widths[i])).join(' | ')} |`;
	return [fmt(headers), fmt(sep), ...rows.map(fmt)].join('\n');
}

export function generatePerfReport(
	pages: PagePerfEntry[],
	components: ComponentPerfEntry[],
	buildDate: Date,
): string {
	const totalPageMs = pages.reduce((s, p) => s + p.totalMs, 0);
	const totalComponentMs = components.reduce((s, c) => s + c.totalMs, 0);
	const totalComponentRenders = components.reduce((s, c) => s + c.count, 0);

	const lines: string[] = [];

	// ── Header ──────────────────────────────────────────────────────────────
	lines.push('# Astro Build Performance Report');
	lines.push('');
	lines.push(`Generated: ${buildDate.toISOString()}`);
	lines.push('');

	// ── Summary ─────────────────────────────────────────────────────────────
	lines.push('## Summary');
	lines.push('');
	lines.push(
		mdTable(
			['Metric', 'Value'],
			[
				['Pages rendered', String(pages.length)],
				['Total page render time', ms(totalPageMs)],
				['Unique components', String(components.length)],
				['Total component renders', String(totalComponentRenders)],
				['Total component render time', ms(totalComponentMs)],
			],
		),
	);
	lines.push('');

	// ── Pages ────────────────────────────────────────────────────────────────
	lines.push('## Pages');
	lines.push('');
	lines.push(
		"> How long each page took to render. Sorted slowest first. **%** is each page's share of total render time.",
	);
	lines.push('');

	if (pages.length === 0) {
		lines.push('_No pages recorded._');
	} else {
		const sorted = [...pages].sort((a, b) => b.totalMs - a.totalMs);
		const rows = sorted.map((p) => [p.pathname, ms(p.totalMs), pct(p.totalMs, totalPageMs)]);
		lines.push(mdTable(['Page', 'Time (ms)', '%'], rows));
	}
	lines.push('');

	// ── Components ───────────────────────────────────────────────────────────
	lines.push('## Components');
	lines.push('');
	lines.push(
		"> How long each component took to render across the entire build, including any child components it contains. Sorted slowest first. **%** is each component's share of total render time.",
	);
	lines.push('');

	if (components.length === 0) {
		lines.push('_No components recorded._');
	} else {
		const rows = components.map((c) => [
			c.component,
			String(c.count),
			ms(c.totalMs),
			pct(c.totalMs, totalComponentMs),
			ms(c.totalMs / c.count),
			ms(c.maxMs),
		]);
		lines.push(mdTable(['Component', 'Renders', 'Time (ms)', '%', 'Avg (ms)', 'Max (ms)'], rows));
	}
	lines.push('');

	return lines.join('\n');
}
