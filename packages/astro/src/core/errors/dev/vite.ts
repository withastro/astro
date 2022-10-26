import type { ModuleLoader } from '../../module-loader/index.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import {
	createLogger,
	type ErrorPayload,
	type Logger,
	type LogLevel,
} from 'vite';
import { AstroErrorCodes } from '../codes.js';
import { AstroError, type ErrorWithMetadata } from '../errors.js';
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

export function enhanceViteSSRError(
	error: Error,
	filePath?: URL,
	loader?: ModuleLoader,
): AstroError {
	// Vite will give you better stacktraces, using sourcemaps.
	if (loader) {
		try {
			loader.fixStacktrace(error);
		} catch {}
	}

	const newError = new AstroError({
		name: error.name,
		message: error.message,
		location: (error as any).loc,
		stack: error.stack,
		errorCode: (error as AstroError).errorCode
			? (error as AstroError).errorCode
			: AstroErrorCodes.UnknownViteSSRError,
	});

	// Vite has a fairly generic error message when it fails to load a module, let's try to enhance it a bit
	// https://github.com/vitejs/vite/blob/ee7c28a46a6563d54b828af42570c55f16b15d2c/packages/vite/src/node/ssr/ssrModuleLoader.ts#L91
	if (filePath && /failed to load module for ssr:/.test(error.message)) {
		const importName = error.message.split('for ssr:').at(1)?.trim();
		if (importName) {
			newError.setMessage(`Could not import "${importName}"`);
			newError.setHint('Make sure the file exists');
			newError.setErrorCode(AstroErrorCodes.FailedToLoadModuleSSR);

			const path = fileURLToPath(filePath);
			const content = fs.readFileSync(path).toString();
			const lns = content.split('\n');
			const line = lns.findIndex((ln) => ln.includes(importName));

			if (line !== -1) {
				const column = lns[line]?.indexOf(importName);

				newError.setLocation({
					file: path,
					line: line + 1,
					column,
				});
			}
		}
	}

	return newError;
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
