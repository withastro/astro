import type * as unifont from 'unifont';
import { LOCAL_PROVIDER_NAME } from '../constants.js';
import type { Hasher } from '../definitions.js';
import type { ResolvedFontFamily } from '../types.js';

export function extractUnifontProviders({
	families,
	hasher,
}: {
	families: Array<ResolvedFontFamily>;
	hasher: Hasher;
}): {
	families: Array<ResolvedFontFamily>;
	providers: Array<unifont.Provider>;
} {
	const hashes = new Set<string>();
	const providers: Array<unifont.Provider> = [];

	for (const { provider } of families) {
		// The local provider logic happens outside of unifont
		if (provider === LOCAL_PROVIDER_NAME) {
			continue;
		}

		const unifontProvider = provider.provider(provider.config);
		const hash = hasher.hashObject({
			name: unifontProvider._name,
			...provider.config,
		});
		// Makes sure every font uses the right instance of a given provider
		// if this provider is provided several times with different options
		// We have to mutate the unifont provider name because unifont deduplicates
		// based on the name.
		unifontProvider._name += `-${hash}`;
		// We set the provider name so we can tell unifont what provider to use when
		// resolving font faces
		provider.name = unifontProvider._name;

		if (!hashes.has(hash)) {
			hashes.add(hash);
			providers.push(unifontProvider);
		}
	}

	return { families, providers };
}
