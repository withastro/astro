// Used by `test/logger.test.ts` to check that a `logger.entrypoint` given as a path
// relative to the project root is resolved and bundled. `__relative` lets the test assert
// this module was actually used, rather than a built-in fallback.
export default function () {
	return { __relative: true, write() {} };
}
