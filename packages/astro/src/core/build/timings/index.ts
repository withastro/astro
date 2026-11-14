import { fileURLToPath } from 'node:url';
import { setBuildTimings } from '@astrojs/internal-helpers/timings';
import type { AstroSettings } from '../../../types/astro.js';
import type { AstroLogger } from '../../logger/core.js';
import { BuildTimingsCollector } from './collector.js';
import { renderCliReport } from './report-cli.js';
import { buildTimingsPlugin } from './vite-plugins.js';

let active: BuildTimingsCollector | undefined;

export async function withBuildTimings<T>(fn: () => Promise<T>): Promise<T> {
	active = new BuildTimingsCollector();
	setBuildTimings(active);
	try {
		return await fn();
	} finally {
		active = undefined;
		setBuildTimings(undefined);
	}
}

export function buildPhase<T>(name: string, fn: () => Promise<T>): Promise<T> {
	return active ? active.span(name, fn) : fn();
}

export function buildTimingsVitePlugins() {
	return active ? [buildTimingsPlugin()] : [];
}

export function printBuildTimings(settings: AstroSettings, logger: AstroLogger): void {
	if (!active) return;
	// The build has already succeeded, so a reporting bug must not fail it.
	try {
		const data = active.toData({
			root: fileURLToPath(settings.config.root),
			output: settings.buildOutput ?? settings.config.output,
		});
		logger.info('SKIP_FORMAT', renderCliReport(data));
	} catch (err) {
		logger.warn('build', `Could not print the timings report: ${err}`);
	}
}
