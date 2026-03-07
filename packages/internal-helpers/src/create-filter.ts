import picomatch from 'picomatch';

import { slash as normalizePath } from './path.js';

export type FilterPattern = readonly (string | RegExp)[] | string | RegExp | null;

function ensureArray(thing: FilterPattern | undefined): readonly (string | RegExp)[] {
	if (Array.isArray(thing)) return thing;
	if (thing == null) return [];
	return [thing] as readonly (string | RegExp)[];
}

interface Matcher {
	test(what: string): boolean;
}

function toMatcher(pattern: string | RegExp): RegExp | Matcher {
	if (pattern instanceof RegExp) {
		return pattern;
	}
	const normalized = normalizePath(pattern);
	const fn = picomatch(normalized, { dot: true });
	return { test: (what: string) => fn(what) };
}

function toRegExp(pattern: string | RegExp): RegExp {
	if (pattern instanceof RegExp) {
		return pattern;
	}
	const normalized = normalizePath(pattern);
	return picomatch.makeRe(normalized, { dot: true });
}

/**
 * Pre-compiles filter patterns into RegExp arrays at build time (in Node.js).
 * This avoids needing picomatch at runtime, which is important for
 * non-Node.js SSR runtimes (e.g. Cloudflare Workers) that don't support CJS `require()`.
 */
export function compileFilterPatterns(
	include?: FilterPattern,
	exclude?: FilterPattern,
): { include: RegExp[]; exclude: RegExp[] } {
	return {
		include: ensureArray(include).map(toRegExp),
		exclude: ensureArray(exclude).map(toRegExp),
	};
}

/**
 * Creates a filter function from pre-compiled RegExp arrays.
 * Does NOT require picomatch — safe for non-Node.js runtimes.
 */
export function createFilterFromRegExps(
	includeMatchers: RegExp[],
	excludeMatchers: RegExp[],
): (id: string | unknown) => boolean {
	if (!includeMatchers.length && !excludeMatchers.length) {
		return (id) => typeof id === 'string' && !id.includes('\0');
	}

	return function (id: string | unknown): boolean {
		if (typeof id !== 'string') return false;
		if (id.includes('\0')) return false;

		const pathId = normalizePath(id);

		for (const matcher of excludeMatchers) {
			matcher.lastIndex = 0;
			if (matcher.test(pathId)) return false;
		}

		for (const matcher of includeMatchers) {
			matcher.lastIndex = 0;
			if (matcher.test(pathId)) return true;
		}

		return !includeMatchers.length;
	};
}

// Fork of `createFilter` from `@rollup/pluginutils` without Node.js APIs.
// https://github.com/rollup/plugins/blob/7d16103b995bcf61f5af1040218a50399599c37e/packages/pluginutils/src/createFilter.ts#L26
export function createFilter(
	include?: FilterPattern,
	exclude?: FilterPattern,
): (id: string | unknown) => boolean {
	const includeMatchers = ensureArray(include).map(toMatcher);
	const excludeMatchers = ensureArray(exclude).map(toMatcher);

	if (!includeMatchers.length && !excludeMatchers.length) {
		return (id) => typeof id === 'string' && !id.includes('\0');
	}

	return function (id: string | unknown): boolean {
		if (typeof id !== 'string') return false;
		if (id.includes('\0')) return false;

		const pathId = normalizePath(id);

		for (const matcher of excludeMatchers) {
			if (matcher instanceof RegExp) {
				matcher.lastIndex = 0;
			}
			if (matcher.test(pathId)) return false;
		}

		for (const matcher of includeMatchers) {
			if (matcher instanceof RegExp) {
				matcher.lastIndex = 0;
			}
			if (matcher.test(pathId)) return true;
		}

		return !includeMatchers.length;
	};
}
