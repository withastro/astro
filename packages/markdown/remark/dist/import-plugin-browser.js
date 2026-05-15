async function importPlugin(p) {
	const importResult = await import(p);
	return importResult.default;
}
export { importPlugin };
