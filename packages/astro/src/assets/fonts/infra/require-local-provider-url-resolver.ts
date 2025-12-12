import { fileURLToPath } from 'node:url';
import type { LocalProviderUrlResolver } from '../definitions.js';
import { resolveEntrypoint } from '../utils.js';

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

	resolve(input: string): string {
		// fileURLToPath is important so that the file can be read
		// by createLocalUrlProxyContentResolver
		const path = fileURLToPath(resolveEntrypoint(this.#root, input));
		this.#intercept?.(path);
		return path;
	}
}
