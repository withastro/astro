import type { LocalProviderUrlResolver } from '../definitions.js';
import { resolveEntrypoint } from '../utils.js';
import { fileURLToPath } from 'node:url';

export function createRequireLocalProviderUrlResolver({
	root,
}: { root: URL }): LocalProviderUrlResolver {
	return {
		resolve(input) {
			// fileURLToPath is important so that the file can be read
			// by createLocalUrlProxyContentResolver
			return fileURLToPath(resolveEntrypoint(root, input));
		},
	};
}
