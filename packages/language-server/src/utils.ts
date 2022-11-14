import { resolve } from 'path';
import type { Position, Range } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { getPackagePath } from './importPackage';

/** Normalizes a document URI */
export function normalizeUri(uri: string): string {
	return URI.parse(uri).toString();
}

/**
 * Some paths (on windows) start with a upper case driver letter, some don't.
 * This is normalized here.
 */
export function normalizePath(path: string): string {
	return URI.file(path).fsPath.replace(/\\/g, '/');
}

/** Turns a URL into a normalized FS Path */
export function urlToPath(stringUrl: string): string | null {
	const url = URI.parse(stringUrl);
	if (url.scheme !== 'file') {
		return null;
	}
	return url.fsPath.replace(/\\/g, '/');
}

/** Converts a path to a URL */
export function pathToUrl(path: string) {
	return URI.file(path).toString();
}

/**
 * Given a path like foo/bar or foo/bar.astro , returns its last path
 * (bar or bar.astro in this example).
 */
export function getLastPartOfPath(path: string): string {
	return path.replace(/\\/g, '/').split('/').pop() || '';
}

/**
 * Return an element in an object using a path as a string (ex: `astro.typescript.format` will return astro['typescript']['format']).
 * From: https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
 */
export function get<T>(obj: Record<string, any>, path: string) {
	const travel = (regexp: RegExp) =>
		String.prototype.split
			.call(path, regexp)
			.filter(Boolean)
			.reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
	const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
	return result === undefined ? undefined : (result as T);
}

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 * From: https://stackoverflow.com/a/48218209
 */
export function mergeDeep(...objects: Record<string, any>[]): Record<string, any> {
	const isObject = (obj: Record<string, any>) => obj && typeof obj === 'object';

	return objects.reduce((prev, obj) => {
		Object.keys(obj).forEach((key) => {
			const pVal = prev[key];
			const oVal = obj[key];

			if (Array.isArray(pVal) && Array.isArray(oVal)) {
				prev[key] = pVal.concat(...oVal);
			} else if (isObject(pVal) && isObject(oVal)) {
				prev[key] = mergeDeep(pVal, oVal);
			} else {
				prev[key] = oVal;
			}
		});

		return prev;
	}, {});
}

/**
 * Transform a string into PascalCase
 */
export function toPascalCase(string: string) {
	return `${string}`
		.replace(new RegExp(/[-_]+/, 'g'), ' ')
		.replace(new RegExp(/[^\w\s]/, 'g'), '')
		.replace(new RegExp(/\s+(.)(\w*)/, 'g'), ($1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`)
		.replace(new RegExp(/\w/), (s) => s.toUpperCase());
}

/**
 * Function to modify each line of a text, preserving the line break style (`\n` or `\r\n`)
 */
export function modifyLines(text: string, replacementFn: (line: string, lineIdx: number) => string): string {
	let idx = 0;
	return text
		.split('\r\n')
		.map((l1) =>
			l1
				.split('\n')
				.map((line) => replacementFn(line, idx++))
				.join('\n')
		)
		.join('\r\n');
}

/** Clamps a number between min and max */
export function clamp(num: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, num));
}

export function isNotNullOrUndefined<T>(val: T | undefined | null): val is T {
	return val !== undefined && val !== null;
}

export function isInRange(range: Range, positionToTest: Position): boolean {
	return isBeforeOrEqualToPosition(range.end, positionToTest) && isBeforeOrEqualToPosition(positionToTest, range.start);
}

export function isBeforeOrEqualToPosition(position: Position, positionToTest: Position): boolean {
	return (
		positionToTest.line < position.line ||
		(positionToTest.line === position.line && positionToTest.character <= position.character)
	);
}

/**
 * Like str.lastIndexOf, but for regular expressions. Note that you need to provide the g-flag to your RegExp!
 */
export function regexLastIndexOf(text: string, regex: RegExp, endPos?: number) {
	if (endPos === undefined) {
		endPos = text.length;
	} else if (endPos < 0) {
		endPos = 0;
	}

	const stringToWorkWith = text.substring(0, endPos + 1);
	let lastIndexOf = -1;
	let result: RegExpExecArray | null = null;
	while ((result = regex.exec(stringToWorkWith)) !== null) {
		lastIndexOf = result.index;
	}
	return lastIndexOf;
}

/**
 * Get all matches of a regexp.
 */
export function getRegExpMatches(regex: RegExp, str: string) {
	const matches: RegExpExecArray[] = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(str))) {
		matches.push(match);
	}
	return matches;
}

/**
 * Debounces a function but cancels previous invocation only if
 * a second function determines it should.
 *
 * @param fn The function with it's argument
 * @param determineIfSame The function which determines if the previous invocation should be canceld or not
 * @param milliseconds Number of miliseconds to debounce
 */
export function debounceSameArg<T>(
	fn: (arg: T) => void,
	shouldCancelPrevious: (newArg: T, prevArg?: T) => boolean,
	milliseconds: number
): (arg: T) => void {
	let timeout: any;
	let prevArg: T | undefined;

	return (arg: T) => {
		if (shouldCancelPrevious(arg, prevArg)) {
			clearTimeout(timeout);
		}

		prevArg = arg;
		timeout = setTimeout(() => {
			fn(arg);
			prevArg = undefined;
		}, milliseconds);
	};
}

/**
 * Debounces a function but also waits at minimum the specified number of milliseconds until
 * the next invocation. This avoids needless calls when a synchronous call (like diagnostics)
 * took too long and the whole timeout of the next call was eaten up already.
 *
 * @param fn The function with it's argument
 * @param milliseconds Number of milliseconds to debounce/throttle
 */
export function debounceThrottle<T extends (...args: any) => void>(fn: T, milliseconds: number): T {
	let timeout: any;
	let lastInvocation = Date.now() - milliseconds;

	function maybeCall(...args: any) {
		clearTimeout(timeout);

		timeout = setTimeout(() => {
			if (Date.now() - lastInvocation < milliseconds) {
				maybeCall(...args);
				return;
			}

			fn(...args);
			lastInvocation = Date.now();
		}, milliseconds);
	}

	return maybeCall as any;
}

/**
 * Try to determine if a workspace could be an Astro project based on the content of `package.json`
 */
export function isAstroWorkspace(workspacePath: string): boolean {
	try {
		const astroPackageJson = require.resolve('./package.json', { paths: [workspacePath] });
		const deps = Object.assign(
			require(astroPackageJson).dependencies ?? {},
			require(astroPackageJson).devDependencies ?? {}
		);

		if (Object.keys(deps).includes('astro')) {
			return true;
		}
	} catch (e) {
		return false;
	}

	return false;
}

export interface AstroInstall {
	path: string;
	version: {
		full: string;
		major: number;
		minor: number;
		patch: number;
	};
}

export function getAstroInstall(basePaths: string[]): AstroInstall | undefined {
	let path;
	let version;

	try {
		path = getPackagePath('astro', basePaths);

		if (!path) {
			throw Error;
		}

		version = require(resolve(path, 'package.json')).version;
	} catch {
		// If we couldn't find it inside the workspace's node_modules, it might means we're in the monorepo
		try {
			path = getPackagePath('./packages/astro', basePaths);

			if (!path) {
				throw Error;
			}

			version = require(resolve(path, 'package.json')).version;
		} catch (e) {
			// If we still couldn't find it, it probably just doesn't exist
			console.error(
				`${basePaths[0]} seems to be an Astro project, but we couldn't find Astro or Astro is not installed`
			);

			return undefined;
		}
	}

	let [major, minor, patch] = version.split('.');

	if (patch.includes('-')) {
		const patchParts = patch.split('-');
		patch = patchParts[0];
	}

	return {
		path,
		version: {
			full: version,
			major: Number(major),
			minor: Number(minor),
			patch: Number(patch),
		},
	};
}
