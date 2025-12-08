import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LocalProviderUrlResolver } from '../definitions.js';

export class RequireLocalProviderUrlResolver implements LocalProviderUrlResolver {
	readonly #root: URL;
	// TODO: remove when stabilizing
	readonly #intercept: ((path: string) => void) | undefined;

	constructor({
		root,
		intercept,
	}: {
		root: URL;
		intercept?: ((path: string) => void) | undefined;
	}) {
		this.#root = root;
		this.#intercept = intercept;
	}

	#resolveEntrypoint(root: URL, entrypoint: string): URL {
		const require = createRequire(root);

		try {
			return pathToFileURL(require.resolve(entrypoint));
		} catch {
			return new URL(entrypoint, root);
		}
	}

	resolve(input: string): string {
		// fileURLToPath is important so that the file can be read
		// by createLocalUrlProxyContentResolver
		const path = fileURLToPath(this.#resolveEntrypoint(this.#root, input));
		this.#intercept?.(path);
		return path;
	}
}
