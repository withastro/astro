import { fileURLToPath } from 'node:url';
import type { LocalProviderUrlResolver } from '../definitions.js';
import { resolveEntrypoint } from '../utils.js';

export function createRequireLocalProviderUrlResolver({
	root,
	intercept,
}: {
	root: URL;
	// TODO: remove when stabilizing
	intercept?: (path: string) => void;
}): LocalProviderUrlResolver {
	return {
		resolve(input) {
			// fileURLToPath is important so that the file can be read
			// by createLocalUrlProxyContentResolver
			const path = fileURLToPath(resolveEntrypoint(root, input));
			intercept?.(path);
			return path;
		},
	};
}
