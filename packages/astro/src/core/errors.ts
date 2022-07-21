import type { BuildResult } from 'esbuild';
import type { ErrorPayload, Logger, LogLevel, ViteDevServer } from 'vite';
import type { SSRError } from '../@types/astro';

import eol from 'eol';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import stripAnsi from 'strip-ansi';
import { createLogger } from 'vite';
import { codeFrame, createSafeError } from './util.js';

export enum AstroErrorCodes {
	// 1xxx: Astro Runtime Errors
	UnknownError = 1000,
	ConfigError = 1001,
	// 2xxx: Astro Compiler Errors
	UnknownCompilerError = 2000,
	UnknownCompilerCSSError = 2001,
}
export interface ErrorWithMetadata {
	[name: string]: any;
	message: string;
	stack: string;
	code?: number;
	hint?: string;
	id?: string;
	frame?: string;
	plugin?: string;
	pluginCode?: string;
	loc?: {
		file?: string;
		line: number;
		column: number;
	};
}

export function cleanErrorStack(stack: string) {
	return stack
		.split(/\n/g)
		.filter((l) => /^\s*at/.test(l))
		.map((l) => l.replace(/\/@fs\//g, '/'))
		.join('\n');
}

/** Update the error message to correct any vite-isms that we don't want to expose to the user. */
export function fixViteErrorMessage(_err: unknown, server: ViteDevServer, filePath?: URL) {
	const err = createSafeError(_err);
	// Vite will give you better stacktraces, using sourcemaps.
	server.ssrFixStacktrace(err);
	// Fix: Astro.glob() compiles to import.meta.glob() by the time Vite sees it,
	// so we need to update this error message in case it originally came from Astro.glob().
	if (err.message === 'import.meta.glob() can only accept string literals.') {
		err.message = 'Astro.glob() and import.meta.glob() can only accept string literals.';
	}
	if (filePath && /failed to load module for ssr:/.test(err.message)) {
		const importName = err.message.split('for ssr:').at(1)?.trim();
		if (importName) {
			const content = fs.readFileSync(fileURLToPath(filePath)).toString();
			const lns = content.split('\n');
			const line = lns.findIndex((ln) => ln.includes(importName));
			const column = lns[line].indexOf(importName);
			if (!(err as any).id) {
				(err as any).id = `${fileURLToPath(filePath)}:${line + 1}:${column + 1}`;
			}
		}
	}
	return err;
}

const incompatiblePackages = {
	'react-spectrum': `@adobe/react-spectrum is not compatible with Vite's server-side rendering mode at the moment. You can still use React Spectrum from the client. Create an island React component and use the client:only directive. From there you can use React Spectrum.`,
};
const incompatPackageExp = new RegExp(`(${Object.keys(incompatiblePackages).join('|')})`);

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

function generateHint(err: ErrorWithMetadata, filePath?: URL): string | undefined {
	if (/Unknown file extension \"\.(jsx|vue|svelte|astro|css)\" for /.test(err.message)) {
		return 'You likely need to add this package to `vite.ssr.noExternal` in your astro config file.';
	} else if (err.toString().startsWith('ReferenceError') && (err.loc?.file ?? filePath?.pathname)?.endsWith('.astro')) {
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
 * Takes any error-like object and returns a standardized Error + metadata object.
 * Useful for consistent reporting regardless of where the error surfaced from.
 */
export function collectErrorMetadata(e: any, filePath?: URL): ErrorWithMetadata {
	const err = e as SSRError;

	if ((e as any).stack) {
		// normalize error stack line-endings to \n
		(e as any).stack = eol.lf((e as any).stack);
		// derive error location from stack (if possible)
		const stackText = stripAnsi(e.stack);
		// TODO: this could be better, `src` might be something else
		const possibleFilePath =
			err.pluginCode ||
			err.id ||
			stackText.split('\n').find((ln) => ln.includes('src') || ln.includes('node_modules'));
		const source = possibleFilePath?.replace(/^[^(]+\(([^)]+).*$/, '$1').replace(/^\s+at\s+/, '');
		const [file, line, column] = source?.split(':') ?? [];
		if (!err.loc && line && column) {
			err.loc = {
				file,
				line: Number.parseInt(line),
				column: Number.parseInt(column),
			};
		}

		// Derive plugin from stack (if possible)
		if (!err.plugin) {
			err.plugin =
				/withastro\/astro\/packages\/integrations\/([\w-]+)/gim.exec(stackText)?.at(1) ||
				/(@astrojs\/[\w-]+)\/(server|client|index)/gim.exec(stackText)?.at(1) ||
				undefined;
		}

		// Normalize stack (remove `/@fs/` urls, etc)
		err.stack = cleanErrorStack(e.stack);
	}

	if (e.name === 'YAMLException') {
		err.loc = { file: (e as any).id, line: (e as any).mark.line, column: (e as any).mark.column };
		err.message = (e as any).reason;
	}

	if (!err.frame && err.loc) {
		try {
			const fileContents = fs.readFileSync(err.loc.file!, 'utf8');
			const frame = codeFrame(fileContents, err.loc);
			err.frame = frame;
		} catch {}
	}

	// Astro error (thrown by esbuild so it needs to be formatted for Vite)
	if (Array.isArray((e as any).errors)) {
		const { location, pluginName, text } = (e as BuildResult).errors[0];
		if (location) {
			err.loc = { file: location.file, line: location.line, column: location.column };
			err.id = err.id || location?.file;
		}
		const possibleFilePath = err.pluginCode || err.id || location?.file;
		if (possibleFilePath && !err.frame) {
			try {
				const fileContents = fs.readFileSync(possibleFilePath, 'utf8');
				err.frame = codeFrame(fileContents, err.loc);
			} catch {
				// do nothing, code frame isn't that big a deal
			}
		}
		if (pluginName) {
			err.plugin = pluginName;
		}
		err.hint = generateHint(err, filePath);
		return err;
	}

	// Generic error (probably from Vite, and already formatted)
	err.hint = generateHint(e, filePath);
	return err;
}

export function getViteErrorPayload(err: ErrorWithMetadata): ErrorPayload {
	let plugin = err.plugin;
	if (!plugin && err.hint) {
		plugin = 'astro';
	}
	const message = `${err.message}\n\n${err.hint ?? ''}`;
	return {
		type: 'error',
		err: {
			...err,
			plugin,
			message: message.trim(),
			stack: err.stack,
		},
	};
}
