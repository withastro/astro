import type { ViteDevServer } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export class BuildRemoteFontProviderModResolver implements RemoteFontProviderModResolver {
	async resolve(id: string): Promise<any> {
		return await import(id);
	}
}

export class DevServerRemoteFontProviderModResolver implements RemoteFontProviderModResolver {
	constructor(private server: ViteDevServer) {}

	async resolve(id: string): Promise<any> {
		return this.server.ssrLoadModule(id);
	}
}
