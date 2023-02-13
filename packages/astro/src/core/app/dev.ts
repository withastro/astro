import type { ComponentInstance, RouteData } from '../../@types/astro';
import type { SSRManifest as Manifest } from './types';
import type { LogOptions } from '../logger/core';
import type http from 'http';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer, type CreateContainerParams } from '../dev/index.js';
import { openConfig, createSettings } from '../config/index.js';
import { createViteLoader } from '../module-loader/index.js';
import { createRouteManifest } from '../routing/index.js';
import {
	createDevelopmentEnvironment,
	getScriptsAndStyles,
	preload,
	type DevelopmentEnvironment
} from '../render/dev/index.js';
import {
	renderPage as coreRenderPage
} from '../render/index.js';
import { App } from './index.js';
import { RenderContext, Environment } from '../render';
import { nodeLogDestination } from '../logger/node.js';

export const logging: LogOptions = {
	dest: nodeLogDestination,
	level: 'error',
};

export type DevAppParams = Partial<CreateContainerParams> & {
	root: URL;
}

export class DevApp extends App {
	#createContainerParams: CreateContainerParams;
	#manifest: Manifest;
	#env: DevelopmentEnvironment | null = null;
	#root: URL;
	#modToRoute = new Map<ComponentInstance, RouteData>();

	// TODO don't expose this entire API
	container: Awaited<ReturnType<typeof createContainer>> | null = null;
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
			// Temporary hack
      entryModules: new Proxy({}, {
        has() {
          return true;
        },
        get(target, key) {
          return key;
        }
      }),
			assets: new Set(),
			propagation: new Map(),
			trailingSlash: userConfig?.trailingSlash ?? 'ignore'
		};
		super(manifest, true);
		this.#manifest = manifest;
		this.#root = root;
		this.#createContainerParams = params;
	}
	
	get loaded() {
		return !!this.container;
	}

	url(pathname: string): string | undefined {
		if(!this.loaded) {
			return undefined;
		}
		const { host, port } = this.container!.settings.config.server
		return new URL(pathname, `http://${host}:${port}`).toString();
	}

	async load() {
		if(this.loaded) {
			await this.close();
			this.container = null;
			this.#env = null;
		}

		const params: CreateContainerParams = {
			...this.#createContainerParams,
		};

		if(!this.#createContainerParams.userConfig) {
			const configResult = await openConfig({
				cmd: 'dev',
				logging,
			});
			params.settings = createSettings(configResult.astroConfig);
		}

		const container = this.container = await createContainer(params);
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
		await this.container?.close();	
	}

	fileChanged(path: string) {
		const container = this.container!;
		const fs = this.#createContainerParams.fs!;
		const root = fileURLToPath(this.#root);
		const fullPath = posix.join(root, path);
		container.viteServer.watcher.emit('change', fullPath);

		if (!fileURLToPath(container.settings.config.root).startsWith('/')) {
			const drive = fileURLToPath(container.settings.config.root).slice(0, 2);
			container.viteServer.watcher.emit('change', drive + fullPath);
		}
	}

	handle(req: http.IncomingMessage, res: http.ServerResponse) {
		this.container!.handle(req, res);
	}

	async render(request: Request, route?: RouteData | undefined): Promise<Response> {
		if(!this.loaded) {
			await this.load();
		}
		if(!route) {
			route = this.match(request, { matchNotFound: false });
		}
		if(route) {
			const filePath = new URL(route.component, this.#root);

			// Always run preload so that if there has been a change in the file, the new
			// version will run.
			const [renderers, mod] = await preload({
				env: this.#env!,
				filePath
			});

			// Always reset the renderers as they might have changed.
			this.#manifest.renderers.length = 0;
			this.#manifest.renderers.push(...renderers);

			// Save this module in the pageMap, so that super.render() finds it.
			this.#manifest.pageMap.set(route.component, mod);
			this.#modToRoute.set(mod, route);
		}
		return super.render(request, route);
	}

	renderPage = async (mod: ComponentInstance, ctx: RenderContext, env: Environment) => {
		const route = this.#modToRoute.get(mod)!;

		const { scripts, links, styles, propagationMap } = await getScriptsAndStyles({
			env: this.#env!,
			filePath: new URL(route.component, this.#root),
		});

		ctx.scripts = scripts;
		ctx.links = links;
		ctx.styles = styles;
		ctx.propagation = propagationMap;

		return coreRenderPage(mod, ctx, env);
	};
}
