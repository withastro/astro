import type { SSRManifest } from '../app/types.js';
import type { AstroLogger } from './core.js';
import { createConsoleLogger } from './impls/console.js';

const loggers = new WeakMap<SSRManifest, AstroLogger>();
const destinationResolutions = new WeakMap<SSRManifest, Promise<AstroLogger>>();

/**
 * One identity-stable logger per manifest. Created on first access as a
 * console logger at `manifest.logLevel` (matches `AppPipeline.create` today).
 *
 * Identity stability is a deliberate simplification over the old
 * replace-the-instance `Pipeline.getLogger()`: `resolveLoggerDestination`
 * swaps the destination in place via `AstroLogger.setDestination`, so every
 * holder (state-captured logger, adapterLogger's retained options) writes to
 * the new destination immediately (review M3).
 */
export function getLogger(manifest: SSRManifest): AstroLogger {
	let logger = loggers.get(manifest);
	if (!logger) {
		logger = createConsoleLogger({ level: manifest.logLevel });
		loggers.set(manifest, logger);
	}
	return logger;
}

/**
 * Composition-time injection (dev server logger, DevApp console logger, an
 * App facade constructed with a custom logger path, tests). Must be called
 * before the first `getLogger()` read to take effect deterministically;
 * replaces the stored instance either way.
 */
export function setLogger(manifest: SSRManifest, logger: AstroLogger): void {
	loggers.set(manifest, logger);
}

/**
 * One-shot lazy resolution of the user-configured destination (the
 * `manifest.logger` thunk), applied via `setDestination` on the manifest's
 * identity-stable logger. Memoized single-flight; awaited at request entry
 * exactly where `pipeline.getLogger()` is awaited today.
 *
 * FAILURE SEMANTICS (review R6): reproduces the legacy set-flag-BEFORE-await
 * behavior — a rejecting thunk propagates to the FIRST caller and is NEVER
 * retried; the memo then resolves permanently to the unswapped (console)
 * logger for all subsequent calls. Deliberately not built on
 * `createAsyncManifestMemo`, whose delete-on-rejection default would retry.
 */
export function resolveLoggerDestination(manifest: SSRManifest): Promise<AstroLogger> {
	const existing = destinationResolutions.get(manifest);
	if (existing) {
		return existing;
	}
	const attempt = (async () => {
		const destination = (await manifest.logger?.())?.default;
		const logger = getLogger(manifest);
		if (destination) {
			logger.setDestination(destination);
		}
		return logger;
	})();
	// Store a never-rejecting promise so later callers proceed on the
	// unswapped logger; the first caller still observes the rejection.
	destinationResolutions.set(
		manifest,
		attempt.catch(() => getLogger(manifest)),
	);
	return attempt;
}
