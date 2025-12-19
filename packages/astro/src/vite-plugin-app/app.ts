import type http from 'node:http';
import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { BaseApp, type RenderErrorOptions } from '../core/app/index.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { clientLocalsSymbol } from '../core/constants.js';
import {
	MiddlewareNoDataOrNextCalled,
	MiddlewareNotAResponse,
} from '../core/errors/errors-data.js';
import { type AstroError, createSafeError, isAstroError } from '../core/errors/index.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { CreateRenderContext, RenderContext } from '../core/render-context.js';
import { createRequest } from '../core/request.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { RouteData, SSRManifest } from '../types/public/index.js';
import { RunnablePipeline } from './pipeline.js';
import { getCustom404Route, getCustom500Route } from '../core/routing/helpers.js';
import { matchRoute } from '../core/routing/dev.js';
import type { DevMatch } from '../core/app/base.js';

export class AstroServerApp extends BaseApp<RunnablePipeline> {
	settings: AstroSettings;
	logger: Logger;
	loader: ModuleLoader;
	manifestData: RoutesList;
	currentRenderContext: RenderContext | undefined = undefined;
	resolvedPathname: string | undefined = undefined;
	constructor(
		manifest: SSRManifest,
		streaming = true,
		logger: Logger,
		manifestData: RoutesList,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	) {
		super(manifest, streaming, settings, logger, loader, manifestData, getDebugInfo);
		this.settings = settings;
		this.logger = logger;
		this.loader = loader;
		this.manifestData = manifestData;
	}

	isDev(): boolean {
		return true;
	}

	async devMatch(pathname: string): Promise<DevMatch | undefined> {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline as unknown as RunnablePipeline,
			this.manifest,
		);
		if (!matchedRoute) {
			return undefined;
		}

		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	static async create(
		manifest: SSRManifest,
		routesList: RoutesList,
		logger: Logger,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	): Promise<AstroServerApp> {
		return new AstroServerApp(manifest, true, logger, routesList, loader, settings, getDebugInfo);
	}

	createPipeline(
		_streaming: boolean,
		manifest: SSRManifest,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader,
		manifestData: RoutesList,
		getDebugInfo: () => Promise<string>,
	): RunnablePipeline {
		return RunnablePipeline.create(manifestData, {
			loader,
			logger,
			manifest,
			settings,
			getDebugInfo,
		});
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		this.currentRenderContext = await super.createRenderContext({
			...payload,
			pathname: this.resolvedPathname ?? payload.pathname,
		});
		return this.currentRenderContext;
	}

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}
}
