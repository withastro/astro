import { XxHasher } from './implementations.js';
import { resolveFamilies } from './logic.js';
import type { FontFamily } from './types.js';

export async function main({ families }: { families: Array<FontFamily> }) {
	const hasher = await XxHasher.create();

	const resolvedFamilies = await resolveFamilies({
		families,
		hasher,
		remoteFontProviderResolver,
		localProviderUrlResolver,
	});
}
