import * as fs from 'node:fs';
import type { SSRManifest } from 'astro';
import { AppPipeline, BaseApp } from 'astro/app';
import { applyPolyfills } from 'astro/app/node';

applyPolyfills();

class MyApp extends BaseApp {
	#manifest: SSRManifest | undefined;
	constructor(manifest: SSRManifest, streaming = false) {
		super(manifest, streaming);
		this.#manifest = manifest;
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
			logger: this.logger,
			manifest: this.manifest,
			streaming,
		});
	}
}

export function createExports(manifest: SSRManifest) {
	return {
		manifest,
		createApp: (streaming: boolean) => new MyApp(manifest, streaming),
	};
}
