import type { RunnableDevEnvironment } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export class DevServerRemoteFontProviderModResolver implements RemoteFontProviderModResolver {
	readonly #environment: RunnableDevEnvironment;

	constructor({
		environment,
	}: {
		environment: RunnableDevEnvironment;
	}) {
		this.#environment = environment;
	}

	async resolve(id: string): Promise<any> {
		return this.#environment.runner.import(id);
	}
}
