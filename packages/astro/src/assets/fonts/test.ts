import { AstroErrorHandler } from './implementations/error-handler.js';
import { XxHasher } from './implementations/hasher.js';
import { RequireLocalProviderUrlResolver } from './implementations/local-provider-url-resolver.js';
import { BuildRemoteFontProviderResolver } from './implementations/remote-font-provider-resolver.js';
import { FsStorage } from './implementations/storage.js';
import { extractUnifontProviders, resolveFamilies } from './logic.js';
import type { FontFamily } from './types.js';
import * as unifont from 'unifont';

export async function main({
	families,
	root,
	cacheDir,
}: { families: Array<FontFamily>; root: URL; cacheDir: URL }) {
	const hasher = await XxHasher.create();
	const errorHandler = new AstroErrorHandler();
	const remoteFontProviderResolver = new BuildRemoteFontProviderResolver(root, errorHandler);
	const localProviderUrlResolver = new RequireLocalProviderUrlResolver(root);
	const storage = FsStorage.create(cacheDir);

	let resolvedFamilies = await resolveFamilies({
		families,
		hasher,
		remoteFontProviderResolver,
		localProviderUrlResolver,
	});

	const extractedUnifontProvidersResult = extractUnifontProviders({
		families: resolvedFamilies,
		hasher,
	});
	resolvedFamilies = extractedUnifontProvidersResult.families;
	const unifontProviders = extractedUnifontProvidersResult.providers;

	// Probably not worth making a dependency
	const { resolveFont } = await unifont.createUnifont(unifontProviders, {
		storage,
	});
}
