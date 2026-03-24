function require(_: unknown) {
	throw new Error("Not supported");
}
require.resolve = () => { throw new Error("Not supported") };

export function createRequire(_: unknown) {
	return require;
}
