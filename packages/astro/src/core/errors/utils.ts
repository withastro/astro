import eol from 'eol';
import { BuildResult } from 'esbuild';
import * as fs from 'fs';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'url';
import { createLogger, ErrorPayload, Logger, LogLevel, ViteDevServer } from 'vite';
import { SSRError } from '../../@types/astro.js';
import { AstroErrorCodes } from './codes.js';
import { AggregateError, AstroError, ErrorWithMetadata } from './errors.js';
import { codeFrame } from './printer.js';

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

/**
 * Get the line and character based on the offset
 * @param offset The index of the position
 * @param text The text for which the position should be retrived
 */
export function positionAt(
	offset: number,
	text: string
): {
	line: number;
	column: number;
} {
	const lineOffsets = getLineOffsets(text);
	offset = Math.max(0, Math.min(text.length, offset));

	let low = 0;
	let high = lineOffsets.length;
	if (high === 0) {
		return {
			line: 0,
			column: offset,
		};
	}

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const lineOffset = lineOffsets[mid];

		if (lineOffset === offset) {
			return {
				line: mid,
				column: 0,
			};
		} else if (offset > lineOffset) {
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}

	// low is the least x for which the line offset is larger than the current offset
	// or array.length if no line offset is larger than the current offset
	const line = low - 1;
	return { line, column: offset - lineOffsets[line] };
}

function getLineOffsets(text: string) {
	const lineOffsets = [];
	let isLineStart = true;

	for (let i = 0; i < text.length; i++) {
		if (isLineStart) {
			lineOffsets.push(i);
			isLineStart = false;
		}
		const ch = text.charAt(i);
		isLineStart = ch === '\r' || ch === '\n';
		if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
			i++;
		}
	}

	if (isLineStart && text.length > 0) {
		lineOffsets.push(text.length);
	}

	return lineOffsets;
}

export function enhanceViteSSRError(
	error: Error,
	filePath?: URL,
	viteServer?: ViteDevServer
): AstroError {
	// Vite will give you better stacktraces, using sourcemaps.
	if (viteServer) {
		viteServer?.ssrFixStacktrace(error);
	}

	const newError = new AstroError({
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
 * Takes any error-like object and returns a standardized Error + metadata object.
 * Useful for consistent reporting regardless of where the error surfaced from.
 */
export function collectErrorMetadata(e: any, filePath?: URL): ErrorWithMetadata {
	const err = AggregateError.is(e) ? (e.errors as SSRError[]) : [e as SSRError];

	err.forEach((error) => {
		if (error.stack) {
			error = collectInfoFromStacktrace(e);
		}

		// If we don't have a frame, but we have a location let's try making up a frame for it
		if (!error.frame && error.loc) {
			try {
				const fileContents = fs.readFileSync(error.loc.file!, 'utf8');
				const frame = codeFrame(fileContents, error.loc);
				error.frame = frame;
			} catch {}
		}

		// Generic error (probably from Vite, and already formatted)
		if (!error.hint) {
			error.hint = generateHint(e, filePath);
		}
	});

	// If we received an array of errors and it's not from us, it should be from ESBuild, try to extract info for Vite to display
	if (!AggregateError.is(e) && Array.isArray((e as any).errors)) {
		(e as BuildResult).errors.forEach((buildError, i) => {
			const { location, pluginName } = buildError;

			if (location) {
				err[i].loc = { file: location.file, line: location.line, column: location.column };
				err[i].id = err[0].id || location?.file;
			}

			const possibleFilePath = err[i].pluginCode || err[i].id || location?.file;
			if (possibleFilePath && !err[i].frame) {
				try {
					const fileContents = fs.readFileSync(possibleFilePath, 'utf8');
					err[i].frame = codeFrame(fileContents, { ...err[i].loc, file: possibleFilePath });
				} catch {
					// do nothing, code frame isn't that big a deal
				}
			}

			if (pluginName) {
				err[i].plugin = pluginName;
			}

			err[i].hint = generateHint(err[0], filePath);
		});
	}

	// TODO: Handle returning multiple errors
	return err[0];
}

export function collectInfoFromStacktrace(error: SSRError): SSRError {
	if (!error.stack) return error;

	// normalize error stack line-endings to \n
	error.stack = eol.lf(error.stack);
	const stackText = stripAnsi(error.stack);

	// Try to find possible location from stack if we don't have one
	if (!error.loc || (!error.loc.column && !error.loc.line)) {
		const possibleFilePath =
			error.loc?.file ||
			error.pluginCode ||
			error.id ||
			// TODO: this could be better, `src` might be something else
			stackText.split('\n').find((ln) => ln.includes('src') || ln.includes('node_modules'));
		const source = possibleFilePath?.replace(/^[^(]+\(([^)]+).*$/, '$1').replace(/^\s+at\s+/, '');

		const [file, line, column] = source?.split(':') ?? [];
		if (line && column) {
			error.loc = {
				file,
				line: Number.parseInt(line),
				column: Number.parseInt(column),
			};
		}
	}

	// Derive plugin from stack (if possible)
	if (!error.plugin) {
		error.plugin =
			/withastro\/astro\/packages\/integrations\/([\w-]+)/gim.exec(stackText)?.at(1) ||
			/(@astrojs\/[\w-]+)\/(server|client|index)/gim.exec(stackText)?.at(1) ||
			undefined;
	}

	// Normalize stack (remove `/@fs/` urls, etc)
	error.stack = cleanErrorStack(error.stack);

	return error;
}

function cleanErrorStack(stack: string) {
	return stack
		.split(/\n/g)
		.map((l) => l.replace(/\/@fs\//g, '/'))
		.join('\n');
}

const incompatiblePackages = {
	'react-spectrum': `@adobe/react-spectrum is not compatible with Vite's server-side rendering mode at the moment. You can still use React Spectrum from the client. Create an island React component and use the client:only directive. From there you can use React Spectrum.`,
};
const incompatPackageExp = new RegExp(`(${Object.keys(incompatiblePackages).join('|')})`);

function generateHint(err: ErrorWithMetadata, filePath?: URL): string | undefined {
	if (/Unknown file extension \"\.(jsx|vue|svelte|astro|css)\" for /.test(err.message)) {
		return 'You likely need to add this package to `vite.ssr.noExternal` in your astro config file.';
	} else if (
		err.toString().startsWith('ReferenceError') &&
		(err.loc?.file ?? filePath?.pathname)?.endsWith('.astro')
	) {
		return 'export statements in `.astro` files do not have access to local variable declarations, only imported values.';
	} else {
		const res = incompatPackageExp.exec(err.stack);
		if (res) {
			const key = res[0] as keyof typeof incompatiblePackages;
			return incompatiblePackages[key];
		}
	}
	return undefined;
}

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
