import { renderContentMap } from '../.astro/render-content-generated';

export async function renderContent(this: any, entry: { id: string } | string) {
	// TODO: respect srcDir
	const contentKey = typeof entry === 'object' ? entry.id : entry;
	const modImport = renderContentMap[contentKey];

	if (!modImport) throw new Error(`${JSON.stringify(contentKey)} does not exist!`);

	const mod = await modImport();

	if (import.meta.env.PROD && 'collectedCss' in mod && 'links' in (this ?? {})) {
		for (const cssAsset of mod.collectedCss) {
			this.links.add({ props: { rel: 'stylesheet', href: cssAsset }, children: '' });
		}
	}
	return mod;
}
