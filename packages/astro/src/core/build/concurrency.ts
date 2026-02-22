import os from 'node:os';

export type BuildConcurrency = number | 'auto' | undefined;

function getAutoConcurrency(): number {
	// Use available CPU count for default parallelism.
	return Math.max(1, os.cpus().length || 1);
}

export function resolveBuildConcurrency(concurrency: BuildConcurrency): number {
	if (concurrency === 'auto' || concurrency == null) {
		return getAutoConcurrency();
	}

	return Math.max(1, concurrency);
}
