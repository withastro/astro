import { fileURLToPath } from 'node:url';
import { setBuildTimings } from '@astrojs/internal-helpers/timings';
import type { AstroSettings } from '../../../types/astro.js';
import type { AstroLogger } from '../../logger/core.js';
import { BuildTimingsCollector, type SpanCategory } from './collector.js';
import { renderCliReport } from './report-cli.js';

export { instrumentViteConfig } from './vite-plugins.js';

let active: BuildTimingsCollector | undefined;

export function getBuildTimings(): BuildTimingsCollector | undefined {
	return active;
}

export function startBuildTimings(): BuildTimingsCollector {
	active = new BuildTimingsCollector();
	setBuildTimings(active);
	return active;
}

export function stopBuildTimings(): void {
	active = undefined;
	setBuildTimings(undefined);
}

/** Measures a build phase, and stays out of the way when `--timings` was not passed. */
export function buildPhase<T>(
	name: string,
	category: SpanCategory,
	fn: () => Promise<T>,
): Promise<T> {
	return active ? active.span(name, category, fn) : fn();
}

/** The build already succeeded by this point, so a reporting bug must not fail it. */
export function writeBuildTimings(
	collector: BuildTimingsCollector,
	settings: AstroSettings,
	logger: AstroLogger,
): void {
	try {
		const data = collector.toData({
			root: fileURLToPath(settings.config.root),
			output: settings.buildOutput ?? settings.config.output,
		});
		logger.info('SKIP_FORMAT', renderCliReport(data));
	} catch (err) {
		logger.warn('build', `Could not print the timings report: ${err}`);
	}
}
