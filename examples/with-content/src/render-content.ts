const content = import.meta.glob('./content/**/*.md');

export async function renderContent(entry: { id: string } | string) {
	// TODO: respect srcDir
	const unresolvedContentKey = typeof entry === 'object' ? entry.id : entry;
	const contentKey = `./content/${unresolvedContentKey}`;
	const modImport = content[contentKey];

	if (!modImport) throw new Error(`${JSON.stringify(unresolvedContentKey)} does not exist!`);

	const mod = await modImport();
	return mod;
}
