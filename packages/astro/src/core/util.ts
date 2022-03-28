import type { AstroConfig } from '../@types/astro';
import type { ErrorPayload } from 'vite';
import eol from 'eol';
import path from 'path';
import slash from 'slash';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import resolve from 'resolve';

/** Returns true if argument is an object of any prototype/class (but not null). */
export function isObject(value: unknown): value is Record<string, any> {
	return typeof value === 'object' && value != null;
}

/** Wraps an object in an array. If an array is passed, ignore it. */
export function arraify<T>(target: T | T[]): T[] {
	return Array.isArray(target) ? target : [target];
}

/** is a specifier an npm package? */
export function parseNpmName(spec: string): { scope?: string; name: string; subpath?: string } | undefined {
	// not an npm package
	if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

	let scope: string | undefined;
	let name = '';

	let parts = spec.split('/');
	if (parts[0][0] === '@') {
		scope = parts[0];
		name = parts.shift() + '/';
	}
	name += parts.shift();

	let subpath = parts.length ? `./${parts.join('/')}` : undefined;

	return {
		scope,
		name,
		subpath,
	};
}

/** Coalesce any throw variable to an Error instance. */
export function createSafeError(err: any): Error {
	return err instanceof Error || (err && err.name && err.message) ? err : new Error(JSON.stringify(err));
}

/** generate code frame from esbuild error */
export function codeFrame(src: string, loc: ErrorPayload['err']['loc']): string {
	if (!loc) return '';
	const lines = eol.lf(src).split('\n');
	// grab 2 lines before, and 3 lines after focused line
	const visibleLines = [];
	for (let n = -2; n <= 2; n++) {
		if (lines[loc.line + n]) visibleLines.push(loc.line + n);
	}
	// figure out gutter width
	let gutterWidth = 0;
	for (const lineNo of visibleLines) {
		let w = `> ${lineNo}`;
		if (w.length > gutterWidth) gutterWidth = w.length;
	}
	// print lines
	let output = '';
	for (const lineNo of visibleLines) {
		const isFocusedLine = lineNo === loc.line - 1;
		output += isFocusedLine ? '> ' : '  ';
		output += `${lineNo + 1} | ${lines[lineNo]}\n`;
		if (isFocusedLine) output += `${[...new Array(gutterWidth)].join(' ')}  | ${[...new Array(loc.column)].join(' ')}^\n`;
	}
	return output;
}

export function resolveDependency(dep: string, astroConfig: AstroConfig) {
	const resolved = resolve.sync(dep, {
		basedir: fileURLToPath(astroConfig.projectRoot),
	});
	// For Windows compat, we need a fully resolved `file://` URL string
	return pathToFileURL(resolved).toString();
}

/**
 * Convert file URL to ID for viteServer.moduleGraph.idToModuleMap.get(:viteID)
 * Format:
 *   Linux/Mac:  /Users/astro/code/my-project/src/pages/index.astro
 *   Windows:    C:/Users/astro/code/my-project/src/pages/index.astro
 */
export function viteID(filePath: URL): string {
	return slash(fileURLToPath(filePath));
}

export const VALID_ID_PREFIX = `/@id/`;

// Strip valid id prefix. This is prepended to resolved Ids that are
// not valid browser import specifiers by the importAnalysis plugin.
export function unwrapId(id: string): string {
	return id.startsWith(VALID_ID_PREFIX) ? id.slice(VALID_ID_PREFIX.length) : id;
}

/** An fs utility, similar to `rimraf` or `rm -rf` */
export function removeDir(_dir: URL): void {
	const dir = fileURLToPath(_dir);
	fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
}

export function emptyDir(_dir: URL, skip?: Set<string>): void {
	const dir = fileURLToPath(_dir);
	if (!fs.existsSync(dir)) return undefined;
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}
		fs.rmSync(path.resolve(dir, file), { recursive: true, force: true, maxRetries: 3 });
	}
}

export function isBuildingToSSR(config: AstroConfig): boolean {
	return !!config._ctx.adapter?.serverEntrypoint;
}

