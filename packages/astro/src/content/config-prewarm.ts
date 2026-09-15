import type fsMod from 'node:fs';
import type { RunnableDevEnvironment } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import { getContentPaths, reloadContentConfigObserver } from './utils.js';

/**
 * Starts the content config load as early as possible during dev startup so its
 * on-demand Vite compilation overlaps other startup work instead of blocking it.
 *
 * The types generator (`createContentTypesGenerator#init`) and the dev server
 * app compile both dedupe on the same in-flight promise, so the config is
 * compiled and evaluated exactly once per dev server instance.
 */
let inFlight: Promise<void> | undefined;

export function getContentConfigLoadPromise(): Promise<void> | undefined {
	return inFlight;
}

export function kickOffContentConfigLoad({
	settings,
	fs,
	logger,
	environment,
}: {
	settings: AstroSettings;
	fs: typeof fsMod;
	logger: AstroLogger;
	environment: RunnableDevEnvironment;
}): Promise<void> {
	if (inFlight) {
		return inFlight;
	}
	const contentPaths = getContentPaths(
		settings.config,
		fs,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	if (!contentPaths.config.exists) {
		return Promise.resolve();
	}
	inFlight = reloadContentConfigObserver({
		fs,
		settings,
		environment,
		logger,
	}).finally(() => {
		inFlight = undefined;
	});
	return inFlight;
}