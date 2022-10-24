import { renderContentMap } from '../.astro/render-content-generated';

export async function renderContent(entry: { id: string } | string, $$result?: any) {
	// TODO: respect srcDir
	const contentKey = typeof entry === 'object' ? entry.id : entry;
	const modImport = renderContentMap[contentKey];

	if (!modImport) throw new Error(`${JSON.stringify(contentKey)} does not exist!`);

	const mod = await modImport();

	if (import.meta.env.PROD && 'collectedCss' in mod && $$result) {
		for (const cssAsset of mod.collectedCss) {
			$$result.links.add({ props: { rel: 'stylesheet', href: cssAsset }, children: '' });
		}
	}
	return mod;
}
