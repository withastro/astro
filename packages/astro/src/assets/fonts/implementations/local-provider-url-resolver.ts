import type { LocalProviderUrlResolver } from '../definitions.js';
import { resolveEntrypoint } from '../utils.js';
import { fileURLToPath } from 'node:url';

export class RequireLocalProviderUrlResolver implements LocalProviderUrlResolver {
	constructor(private root: URL) {}

	resolve(input: string): string {
		return fileURLToPath(resolveEntrypoint(this.root, input));
	}
}
