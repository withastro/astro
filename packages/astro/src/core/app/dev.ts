import type { ManifestData, RouteData } from '../../@types/astro';
import type { SSRManifest as Manifest } from './types';
import { createContainer, type CreateContainerParams } from '../dev/index.js';
import { createViteLoader } from '../module-loader/index.js';
import { createRouteManifest } from '../routing/index.js';
import { createDevelopmentEnvironment, preload, type DevelopmentEnvironment } from '../render/dev/index.js';
import { App, MatchOptions } from './index.js';

export type DevAppParams = Partial<CreateContainerParams> & {
	root: URL;
}

export class DevApp extends App {
	#createContainerParams: CreateContainerParams;
	#manifest: Manifest;
	#container: Awaited<ReturnType<typeof createContainer>> | null = null;
	#env: DevelopmentEnvironment | null = null;
	#root: URL;
	constructor(params: DevAppParams) {
		const { root, userConfig } = params;
		const manifest: Manifest = {
			adapterName: 'development',
			base: userConfig?.base,
			routes: [],
			markdown: {
				contentDir: root
			},
			pageMap: new Map(),
			renderers: [],
			entryModules: {},
			assets: new Set(),
			propagation: new Map(),
			trailingSlash: userConfig?.trailingSlash ?? 'ignore'
		};
		super(manifest, true);
		this.#manifest = manifest;
		this.#root = root;
		this.#createContainerParams = params;
	}

	async load() {
		const container = this.#container = await createContainer(this.#createContainerParams);
		this.#manifest.trailingSlash = container.settings.config.trailingSlash;

		const loader = createViteLoader(container.viteServer);
		
		const routeManifest = createRouteManifest({
			settings: container.settings,
			fsMod: this.#createContainerParams.fs
		}, container.logging);
		const routes = routeManifest.routes.map(routeData => {
			return {
				routeData,
				file: routeData.component,
				links: [],
				scripts: []
			}
		});
		this.updateRoutes(routes);
		this.#env = createDevelopmentEnvironment(container.settings, container.logging, loader);
		return this;
	}

	async close() {
		await this.#container?.close();	
	}

	async render(request: Request, route?: RouteData | undefined): Promise<Response> {
		if(!this.#env) {
			await this.load();
		}
		if(!route) {
			route = this.match(request, { matchNotFound: false });
		}
		if(route) {
			const filePath = new URL(route.component, this.#root);
			debugger;
			const [renderers, mod] = await preload({
				env: this.#env!,
				filePath
			});
			this.#manifest.renderers.length = 0;
			this.#manifest.renderers.push(...renderers);
			this.#manifest.pageMap.set(route.component, mod);
		}
		return super.render(request, route);
	}
}
