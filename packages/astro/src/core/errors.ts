import eol from 'eol';
import type { BuildResult } from 'esbuild';
import fs from 'fs';
import type { ViteDevServer } from 'vite';
import type { SSRError } from '../@types/astro';
import { codeFrame, createSafeError } from './util.js';

export interface ErrorWithMetadata {
	[name: string]: any;
	message: string;
	stack: string;
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
		.join('\n');
}

/** Update the error message to correct any vite-isms that we don't want to expose to the user. */
export function fixViteErrorMessage(_err: unknown, server: ViteDevServer) {
	const err = createSafeError(_err);
	// Vite will give you better stacktraces, using sourcemaps.
	server.ssrFixStacktrace(err);
	// Fix: Astro.glob() compiles to import.meta.glob() by the time Vite sees it,
	// so we need to update this error message in case it originally came from Astro.glob().
	if (err.message === 'import.meta.glob() can only accept string literals.') {
		err.message = 'Astro.glob() and import.meta.glob() can only accept string literals.';
	}
	return err;
}

const incompatiblePackages = {
	'react-spectrum': `@adobe/react-spectrum is not compatible with Vite's server-side rendering mode at the moment. You can still use React Spectrum from the client. Create an island React component and use the client:only directive. From there you can use React Spectrum.`,
};
const incompatPackageExp = new RegExp(`(${Object.keys(incompatiblePackages).join('|')})`);

function generateHint(err: ErrorWithMetadata): string | undefined {
	if (/Unknown file extension \"\.(jsx|vue|svelte|astro|css)\" for /.test(err.message)) {
		return 'You likely need to add this package to `vite.ssr.noExternal` in your astro config file.';
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
export function collectErrorMetadata(e: any): ErrorWithMetadata {
	// normalize error stack line-endings to \n
	if ((e as any).stack) {
		(e as any).stack = eol.lf((e as any).stack);
	}


	if (e.name === 'YAMLException') {
		const err = e as SSRError;
		err.loc = { file: (e as any).id, line: (e as any).mark.line, column: (e as any).mark.column }
		err.message = (e as any).reason;
		
		if (!err.frame) {
			try {
				const fileContents = fs.readFileSync(err.loc.file!, 'utf8');
				err.frame = codeFrame(fileContents, err.loc);
			} catch {}
		}
	}

	// Astro error (thrown by esbuild so it needs to be formatted for Vite)
	if (Array.isArray((e as any).errors)) {
		const { location, pluginName, text } = (e as BuildResult).errors[0];
		const err = e as SSRError;
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
		err.hint = generateHint(err);
		return err;
	}

	// Generic error (probably from Vite, and already formatted)
	e.hint = generateHint(e);
	return e;
}
