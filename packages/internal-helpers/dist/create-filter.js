import picomatch from 'picomatch';
import { slash as normalizePath } from './path.js';
function ensureArray(thing) {
	if (Array.isArray(thing)) return thing;
	if (thing == null) return [];
	return [thing];
}
function toMatcher(pattern) {
	if (pattern instanceof RegExp) {
		return pattern;
	}
	const normalized = normalizePath(pattern);
	const fn = picomatch(normalized, { dot: true });
	return { test: (what) => fn(what) };
}
function createFilter(include, exclude) {
	const includeMatchers = ensureArray(include).map(toMatcher);
	const excludeMatchers = ensureArray(exclude).map(toMatcher);
	if (!includeMatchers.length && !excludeMatchers.length) {
		return (id) => typeof id === 'string' && !id.includes('\0');
	}
	return function (id) {
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
export { createFilter };
