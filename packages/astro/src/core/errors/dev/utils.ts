import type { BuildResult } from 'esbuild';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import stripAnsi from 'strip-ansi';
import type { SSRError } from '../../../@types/astro.js';
import { AggregateError, ErrorWithMetadata } from '../errors.js';
import { codeFrame } from '../printer.js';
import { normalizeLF } from '../utils.js';

export const incompatiblePackages = {
	'react-spectrum': `@adobe/react-spectrum is not compatible with Vite's server-side rendering mode at the moment. You can still use React Spectrum from the client. Create an island React component and use the client:only directive. From there you can use React Spectrum.`,
};
export const incompatPackageExp = new RegExp(`(${Object.keys(incompatiblePackages).join('|')})`);

/**
 * Takes any error-like object and returns a standardized Error + metadata object.
 * Useful for consistent reporting regardless of where the error surfaced from.
 */
export function collectErrorMetadata(e: any, rootFolder?: URL | undefined): ErrorWithMetadata {
	const err = AggregateError.is(e) ? (e.errors as SSRError[]) : [e as SSRError];

	err.forEach((error) => {
		if (error.stack) {
			error = collectInfoFromStacktrace(e);
		}

		if (error.loc?.file && rootFolder && !error.loc.file.startsWith('/')) {
			error.loc.file = join(fileURLToPath(rootFolder), error.loc.file);
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
		error.hint = generateHint(e);
	});

	// If we received an array of errors and it's not from us, it should be from ESBuild, try to extract info for Vite to display
	if (!AggregateError.is(e) && Array.isArray((e as any).errors)) {
		(e as BuildResult).errors.forEach((buildError, i) => {
			const { location, pluginName, text } = buildError;

			// ESBuild can give us a slightly better error message than the one in the error, so let's use it
			err[i].message = text;

			if (location) {
				err[i].loc = { file: location.file, line: location.line, column: location.column };
				err[i].id = err[0].id || location?.file;
			}

			// Vite adds the error message to the frame for ESBuild errors, we don't want that
			if (err[i].frame) {
				const errorLines = err[i].frame?.trim().split('\n');

				if (errorLines) {
					err[i].frame = !/^\d/.test(errorLines[0])
						? errorLines?.slice(1).join('\n')
						: err[i].frame;
				}
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

			err[i].hint = generateHint(err[0]);
		});
	}

	// TODO: Handle returning multiple errors
	return err[0];
}

function generateHint(err: ErrorWithMetadata): string | undefined {
	if (/Unknown file extension \"\.(jsx|vue|svelte|astro|css)\" for /.test(err.message)) {
		return 'You likely need to add this package to `vite.ssr.noExternal` in your astro config file.';
	} else if (err.toString().includes('document')) {
		const hint = `Browser APIs are not available on the server.

${
	err.loc?.file?.endsWith('.astro')
		? 'Move your code to a <script> tag outside of the frontmatter, so the code runs on the client'
		: 'If the code is in a framework component, try to access these objects after rendering using lifecycle methods or use a `client:only` directive to make the component exclusively run on the client'
}

See https://docs.astro.build/en/guides/troubleshooting/#document-or-window-is-not-defined for more information.
		`;
		return hint;
	} else {
		const res = incompatPackageExp.exec(err.stack);
		if (res) {
			const key = res[0] as keyof typeof incompatiblePackages;
			return incompatiblePackages[key];
		}
	}
	return err.hint;
}

function collectInfoFromStacktrace(error: SSRError): SSRError {
	if (!error.stack) return error;

	// normalize error stack line-endings to \n
	error.stack = normalizeLF(error.stack);
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

		let file = source?.replace(/(:[0-9]+)/g, '');
		const location = /:([0-9]+):([0-9]+)/g.exec(source!) ?? [];
		const line = location[1];
		const column = location[2];

		if (file && line && column) {
			try {
				file = fileURLToPath(file);
			} catch {}

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
