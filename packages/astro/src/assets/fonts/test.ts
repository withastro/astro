import { AstroErrorHandler } from './implementations/error-handler.js';
import { XxHasher } from './implementations/hasher.js';
import { RequireLocalProviderUrlResolver } from './implementations/local-provider-url-resolver.js';
import { BuildRemoteFontProviderResolver } from './implementations/remote-font-provider-resolver.js';
import { extractUnifontProviders, resolveFamilies } from './logic.js';
import type { FontFamily } from './types.js';

export async function main({ families, root }: { families: Array<FontFamily>; root: URL }) {
	const hasher = await XxHasher.create();
	const errorHandler = new AstroErrorHandler();
	const remoteFontProviderResolver = new BuildRemoteFontProviderResolver(root, errorHandler);
	const localProviderUrlResolver = new RequireLocalProviderUrlResolver(root);

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
}
