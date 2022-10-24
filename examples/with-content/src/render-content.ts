import { renderContentMap } from '../.astro/render-content-generated';

export async function renderContent(entry: { id: string } | string) {
	// TODO: respect srcDir
	const contentKey = typeof entry === 'object' ? entry.id : entry;
	const modImport = renderContentMap[contentKey];

	if (!modImport) throw new Error(`${JSON.stringify(contentKey)} does not exist!`);

	const mod = await modImport();
	return mod;
}
