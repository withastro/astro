/**
 * Build-time performance tracker.
 *
 * Collects per-page and per-component render timings during `astro build` and
 * generates a Markdown report at the end of the build.
 *
 * State lives on `globalThis` so it is shared across all module instances,
 * including code loaded inside Vite's SSR module graph (which gets a fresh
 * copy of every ESM module).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagePerfEntry {
	/** URL pathname, e.g. "/about" */
	pathname: string;
	/** Full wall-clock render time in ms (request → written file) */
	totalMs: number;
}

export interface ComponentPerfEntry {
	/** Human-readable component name (displayName passed to renderComponent) */
	component: string;
	/** Total cumulative render time across all renders, in milliseconds */
	totalMs: number;
	/** Number of times this component was rendered */
	count: number;
	/** Maximum single-render time in milliseconds */
	maxMs: number;
}

// ─── globalThis state ─────────────────────────────────────────────────────────

declare global {
	// eslint-disable-next-line no-var
	var __astroBuildPerfEnabled: boolean | undefined;
	// eslint-disable-next-line no-var
	var __astroBuildPerfPages: PagePerfEntry[] | undefined;
	// eslint-disable-next-line no-var
	var __astroBuildPerfComponents: Map<string, ComponentPerfEntry> | undefined;
}

function getPageList(): PagePerfEntry[] {
	if (!globalThis.__astroBuildPerfPages) {
		globalThis.__astroBuildPerfPages = [];
	}
	return globalThis.__astroBuildPerfPages;
}

function getComponentRegistry(): Map<string, ComponentPerfEntry> {
	if (!globalThis.__astroBuildPerfComponents) {
		globalThis.__astroBuildPerfComponents = new Map();
	}
	return globalThis.__astroBuildPerfComponents;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function enableBuildPerfTracking(): void {
	globalThis.__astroBuildPerfEnabled = true;
	globalThis.__astroBuildPerfPages = [];
	globalThis.__astroBuildPerfComponents = new Map();
}

export function disableBuildPerfTracking(): void {
	globalThis.__astroBuildPerfEnabled = false;
}

export function isBuildPerfTrackingEnabled(): boolean {
	return globalThis.__astroBuildPerfEnabled === true;
}

// ─── Recording ────────────────────────────────────────────────────────────────

/** Record the total wall-clock time to render a single page. */
export function recordPageRender(pathname: string, totalMs: number): void {
	if (!isBuildPerfTrackingEnabled()) return;
	getPageList().push({ pathname, totalMs });
}

/** Record a single component render. */
export function recordComponentRender(displayName: string, durationMs: number): void {
	if (!isBuildPerfTrackingEnabled()) return;
	const registry = getComponentRegistry();
	const existing = registry.get(displayName);
	if (existing) {
		existing.totalMs += durationMs;
		existing.count += 1;
		if (durationMs > existing.maxMs) existing.maxMs = durationMs;
	} else {
		registry.set(displayName, {
			component: displayName,
			totalMs: durationMs,
			count: 1,
			maxMs: durationMs,
		});
	}
}

// ─── Reading ──────────────────────────────────────────────────────────────────

/** Pages sorted slowest first. */
export function getPagePerfEntries(): PagePerfEntry[] {
	return [...getPageList()].sort((a, b) => b.totalMs - a.totalMs);
}

/** Components sorted by total cumulative time, slowest first. */
export function getComponentPerfEntries(): ComponentPerfEntry[] {
	return Array.from(getComponentRegistry().values()).sort((a, b) => b.totalMs - a.totalMs);
}
