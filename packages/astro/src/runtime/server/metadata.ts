// NOTE: With the compiler `resolvePath` option, the compiled output would not use
// `$$metadata` for anything else anymore. It will still call `createMetadata()` so
// we leave this stub here. Remove this when the compiler removes the call too.
export function createMetadata() {
	return {};
}
