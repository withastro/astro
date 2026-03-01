import * as fs from 'node:fs';
import type { SSRManifest } from 'astro';
import { AppPipeline, BaseApp, type LogRequestPayload } from 'astro/app';

class MyApp extends BaseApp {
	#manifest: SSRManifest | undefined;
	constructor(manifest: SSRManifest, streaming = false) {
		super(manifest, streaming);
		this.#manifest = manifest;
	}

	isDev(): boolean {
		return false;
	}

	async render(request: Request) {
		const url = new URL(request.url);
		if (this.#manifest?.assets.has(url.pathname)) {
			const filePath = new URL('../../client/' + this.removeBase(url.pathname), import.meta.url);
			const data = await fs.promises.readFile(filePath);
			return new Response(Buffer.from(data));
		}

		return super.render(request);
	}

	createPipeline(streaming: boolean) {
		return AppPipeline.create({
			manifest: this.manifest,
			streaming,
		});
	}

	logRequest(_options: LogRequestPayload) {}
}

export function createExports(manifest: SSRManifest) {
	return {
		manifest,
		createApp: (streaming: boolean) => new MyApp(manifest, streaming),
		// Export App class directly for benchmarks that need to pass custom manifests
		App: MyApp,
	};
}
