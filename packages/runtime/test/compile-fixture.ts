import { transform } from '@astrojs/compiler-rs';

export function compileFixture(source: string, filename: string) {
	return transform(source, {
		filename,
		internalURL: '@astrojs/runtime/compiler-runtime',
		resultScopedSlot: true,
		// Client specifiers reach `resolve()` as written in the component.
		resolvePath: (specifier) => specifier,
	}).code;
}
