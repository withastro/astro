import type { RemoteFontProviderModResolver } from '../definitions.js';

export class BuildRemoteFontProviderModResolver implements RemoteFontProviderModResolver {
	async resolve(id: string): Promise<any> {
		return await import(id);
	}
}
