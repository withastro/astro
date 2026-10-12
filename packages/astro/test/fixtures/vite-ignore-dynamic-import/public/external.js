export function hello() {
	globalThis.externalImportCount = (globalThis.externalImportCount ?? 0) + 1;
}
