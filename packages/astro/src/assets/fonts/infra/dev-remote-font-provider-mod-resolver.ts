import type { ViteDevServer } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export class DevServerRemoteFontProviderModResolver implements RemoteFontProviderModResolver {
	readonly #server: ViteDevServer;

	constructor({
		server,
	}: {
		server: ViteDevServer;
	}) {
		this.#server = server;
	}

	async resolve(id: string): Promise<any> {
		return await this.#server.ssrLoadModule(id);
	}
}
