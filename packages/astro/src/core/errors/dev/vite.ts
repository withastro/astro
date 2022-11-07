import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createLogger, type ErrorPayload, type Logger, type LogLevel } from 'vite';
import type { ModuleLoader } from '../../module-loader/index.js';
import { AstroErrorData } from '../errors-data.js';
import { type ErrorWithMetadata } from '../errors.js';
import { createSafeError } from '../utils.js';
import { incompatPackageExp } from './utils.js';

/**
 * Custom logger with better error reporting for incompatible packages
 */
export function createCustomViteLogger(logLevel: LogLevel): Logger {
	const viteLogger = createLogger(logLevel);
	const logger: Logger = {
		...viteLogger,
		error(msg, options?) {
			// Silence warnings from incompatible packages (we log better errors for these)
			if (incompatPackageExp.test(msg)) return;
			return viteLogger.error(msg, options);
		},
	};
	return logger;
}

export function enhanceViteSSRError(error: unknown, filePath?: URL, loader?: ModuleLoader): Error {
	// NOTE: We don't know where the error that's coming here comes from, so we need to be defensive regarding what we do
	// to it to make sure we keep as much information as possible. It's very possible that we receive an error that does not
	// follow any kind of standard formats (ex: a number, a string etc)
	const safeError = createSafeError(error) as ErrorWithMetadata;

	// Vite will give you better stacktraces, using sourcemaps.
	if (loader) {
		try {
			loader.fixStacktrace(safeError as Error);
		} catch {}
	}

	if (filePath) {
		const path = fileURLToPath(filePath);
		const content = fs.readFileSync(path).toString();
		const lns = content.split('\n');

		// Vite has a fairly generic error message when it fails to load a module, let's try to enhance it a bit
		// https://github.com/vitejs/vite/blob/ee7c28a46a6563d54b828af42570c55f16b15d2c/packages/vite/src/node/ssr/ssrModuleLoader.ts#L91
		if (/failed to load module for ssr:/.test(safeError.message)) {
			const importName = safeError.message.split('for ssr:').at(1)?.trim();
			if (importName) {
				safeError.message = AstroErrorData.FailedToLoadModuleSSR.message(importName);
				safeError.hint = AstroErrorData.FailedToLoadModuleSSR.hint;
				safeError.code = AstroErrorData.FailedToLoadModuleSSR.code;
				const line = lns.findIndex((ln) => ln.includes(importName));

				if (line !== -1) {
					const column = lns[line]?.indexOf(importName);

					safeError.loc = {
						file: path,
						line: line + 1,
						column,
					};
				}
			}
		}

		// Since Astro.glob is a wrapper around Vite's import.meta.glob, errors don't show accurate information, let's fix that
		if (/Invalid glob/.test(safeError.message)) {
			const globPattern = safeError.message.match(/glob: "(.+)" \(/)?.[1];

			if (globPattern) {
				safeError.message = AstroErrorData.InvalidGlob.message(globPattern);
				safeError.hint = AstroErrorData.InvalidGlob.hint;
				safeError.code = AstroErrorData.InvalidGlob.code;

				const line = lns.findIndex((ln) => ln.includes(globPattern));

				if (line !== -1) {
					const column = lns[line]?.indexOf(globPattern);

					safeError.loc = {
						file: path,
						line: line + 1,
						column,
					};
				}
			}
		}
	}

	return safeError;
}

/**
 * Generate a payload for Vite's error overlay
 */
export function getViteErrorPayload(err: ErrorWithMetadata): ErrorPayload {
	let plugin = err.plugin;
	if (!plugin && err.hint) {
		plugin = 'astro';
	}
	const message = `${err.message}\n\n${err.hint ?? ''}`;
	// Vite doesn't handle tabs correctly in its frames, so let's replace them with spaces
	const frame = err.frame?.replace(/\t/g, ' ');
	return {
		type: 'error',
		err: {
			...err,
			frame: frame,
			loc: {
				file: err.loc?.file,
				// If we don't have a line and column, Vite won't make a clickable link, so let's fake 0:0 if we don't have a location
				line: err.loc?.line ?? 0,
				column: err.loc?.column ?? 0,
			},
			plugin,
			message: message.trim(),
			stack: err.stack,
		},
	};
}
