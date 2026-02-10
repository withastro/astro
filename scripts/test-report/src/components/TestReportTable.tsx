import { createSignal, createMemo, For, Show } from 'solid-js';
import './TestReportTable.css';

export interface TestEntry {
	file?: string;
	column?: number;
	line?: number;
	name: string;
	nesting: number;
	testNumber: number;
	details: {
		duration_ms: number;
		error?: unknown;
		type?: string;
	};
	path?: string[];
	todo?: string | boolean;
	skip?: string | boolean;
}

type SortDirection = 'none' | 'asc' | 'desc';
type Status = 'pass' | 'fail' | 'skip' | 'todo';

function getStatus(entry: TestEntry): Status {
	if (entry.skip) return 'skip';
	if (entry.todo) return 'todo';
	if (entry.details.error !== undefined) return 'fail';
	return 'pass';
}

function formatDuration(ms: number): string {
	if (ms < 1) return '< 1ms';
	if (ms < 1000) return `${Math.round(ms)}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.round((ms % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}

const STATUS_ICONS: Record<Status, string> = {
	pass: '\u2713',
	fail: '\u2717',
	skip: '\u2298',
	todo: '\u25CE',
};

export default function TestReportTable(props: { entries: TestEntry[] }) {
	const [fileFilter, setFileFilter] = createSignal('');
	const [minDuration, setMinDuration] = createSignal('');
	const [maxDuration, setMaxDuration] = createSignal('');
	const [sortDir, setSortDir] = createSignal<SortDirection>('none');
	const [showSuites, setShowSuites] = createSignal(false);
	const [statusFilter, setStatusFilter] = createSignal<string>('all');

	const cycleSortDir = () => {
		const cycle: SortDirection[] = ['none', 'desc', 'asc'];
		setSortDir(cycle[(cycle.indexOf(sortDir()) + 1) % cycle.length]);
	};

	const filtered = createMemo(() => {
		let items = props.entries.filter((e) => {
			if (!showSuites() && e.details.type === 'suite') return false;
			const status = getStatus(e);
			if (statusFilter() !== 'all' && status !== statusFilter()) return false;
			const ff = fileFilter().toLowerCase();
			if (ff) {
				if (!e.file) return false;
				if (!e.file.toLowerCase().includes(ff)) return false;
			}
			const minMs = parseFloat(minDuration());
			const maxMs = parseFloat(maxDuration());
			if (!isNaN(minMs) && e.details.duration_ms < minMs) return false;
			if (!isNaN(maxMs) && e.details.duration_ms > maxMs) return false;
			return true;
		});

		if (sortDir() !== 'none') {
			items = [...items].sort((a, b) => {
				const diff = a.details.duration_ms - b.details.duration_ms;
				return sortDir() === 'asc' ? diff : -diff;
			});
		}

		return items;
	});

	const stats = createMemo(() => {
		const all = filtered();
		let pass = 0,
			fail = 0,
			skip = 0,
			todo = 0,
			totalDuration = 0;
		for (const e of all) {
			const s = getStatus(e);
			if (s === 'pass') pass++;
			else if (s === 'fail') fail++;
			else if (s === 'skip') skip++;
			else todo++;
			totalDuration += e.details.duration_ms;
		}
		return { total: all.length, pass, fail, skip, todo, totalDuration };
	});

	const sortLabel = () => {
		if (sortDir() === 'asc') return 'Duration \u2191';
		if (sortDir() === 'desc') return 'Duration \u2193';
		return 'Duration';
	};

	return (
		<div class="report-table">
			<div class="filters">
				<div class="filter-group filter-file">
					<label>File path</label>
					<input
						type="text"
						placeholder="Filter by file path..."
						value={fileFilter()}
						onInput={(e) => setFileFilter(e.currentTarget.value)}
					/>
				</div>
				<div class="filter-row">
					<div class="filter-group filter-duration">
						<label>Min (ms)</label>
						<input
							type="number"
							placeholder="0"
							value={minDuration()}
							onInput={(e) => setMinDuration(e.currentTarget.value)}
						/>
					</div>
					<div class="filter-group filter-duration">
						<label>Max (ms)</label>
						<input
							type="number"
							placeholder="Inf"
							value={maxDuration()}
							onInput={(e) => setMaxDuration(e.currentTarget.value)}
						/>
					</div>
					<div class="filter-group">
						<label>Status</label>
						<select
							value={statusFilter()}
							onChange={(e) => setStatusFilter(e.currentTarget.value)}
						>
							<option value="all">All</option>
							<option value="pass">Pass</option>
							<option value="fail">Fail</option>
							<option value="skip">Skip</option>
							<option value="todo">Todo</option>
						</select>
					</div>
					<div class="filter-group">
						<label class="toggle-label">
							<input
								type="checkbox"
								checked={showSuites()}
								onChange={(e) => setShowSuites(e.currentTarget.checked)}
							/>
							Show suites
						</label>
					</div>
				</div>
			</div>

			<div class="stats-bar">
				<span class="stat-total">{stats().total} tests</span>
				<span class="stat-pass">{STATUS_ICONS.pass} {stats().pass}</span>
				<span class="stat-fail">{STATUS_ICONS.fail} {stats().fail}</span>
				<Show when={stats().skip > 0}>
					<span class="stat-skip">{STATUS_ICONS.skip} {stats().skip}</span>
				</Show>
				<Show when={stats().todo > 0}>
					<span class="stat-todo">{STATUS_ICONS.todo} {stats().todo}</span>
				</Show>
				<span class="stat-duration">{formatDuration(stats().totalDuration)}</span>
			</div>

			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th class="th-status"></th>
							<th class="th-name">Test</th>
							<th class="th-file">File</th>
							<th class="th-duration sortable" onClick={cycleSortDir}>
								{sortLabel()}
							</th>
						</tr>
					</thead>
					<tbody>
						<For each={filtered()}>
							{(entry) => {
								const status = getStatus(entry);
								return (
									<tr class={`row-${status}`}>
										<td class={`cell-status status-${status}`}>
											{STATUS_ICONS[status]}
										</td>
										<td class="cell-name">
											<span
												class="test-name"
												style={{ 'padding-left': `${entry.nesting * 20}px` }}
											>
												{entry.name}
											</span>
										</td>
										<td class="cell-file" title={entry.file ?? ''}>
											{entry.file ?? ''}
										</td>
										<td class="cell-duration">
											{formatDuration(entry.details.duration_ms)}
										</td>
									</tr>
								);
							}}
						</For>
					</tbody>
				</table>
				<Show when={filtered().length === 0}>
					<div class="empty-state">No tests match the current filters</div>
				</Show>
			</div>
		</div>
	);
}
