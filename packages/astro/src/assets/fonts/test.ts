import {
	BuildRemoteFontProviderResolver,
	RequireLocalProviderUrlResolver,
	XxHasher,
} from './implementations.js';
import { extractUnifontProviders, resolveFamilies } from './logic.js';
import type { FontFamily } from './types.js';

export async function main({ families, root }: { families: Array<FontFamily>; root: URL }) {
	const hasher = await XxHasher.create();
	const remoteFontProviderResolver = new BuildRemoteFontProviderResolver(root);
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
