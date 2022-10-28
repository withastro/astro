import type { BuildResult } from 'esbuild';
import * as fs from 'node:fs';
import type { SSRError } from '../../../@types/astro.js';
import { AggregateError, ErrorWithMetadata } from '../errors.js';
import { codeFrame } from '../printer.js';
import { collectInfoFromStacktrace } from '../utils.js';

export const incompatiblePackages = {
	'react-spectrum': `@adobe/react-spectrum is not compatible with Vite's server-side rendering mode at the moment. You can still use React Spectrum from the client. Create an island React component and use the client:only directive. From there you can use React Spectrum.`,
};
export const incompatPackageExp = new RegExp(`(${Object.keys(incompatiblePackages).join('|')})`);

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
