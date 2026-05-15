import fsMod from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { InlineConfig, ViteDevServer } from 'vite';
import type { SerializedSSRManifest } from '../core/app/types.js';
import type { PageBuildData } from '../core/build/types.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type {
	IntegrationResolvedRoute,
	RouteOptions,
	RouteToHeaders,
} from '../types/public/integrations.js';
import type { RouteData } from '../types/public/internal.js';
export declare function getToolbarServerCommunicationHelpers(server: ViteDevServer): {
	/**
	 * Send a message to the dev toolbar that an app can listen for. The payload can be any serializable data.
	 * @param event - The event name
	 * @param payload - The payload to send
	 */
	send: <T>(event: string, payload: T) => void;
	/**
	 * Receive a message from a dev toolbar app.
	 * @param event
	 * @param callback
	 */
	on: <T>(event: string, callback: (data: T) => void) => void;
	/**
	 * Fired when an app is initialized.
	 * @param appId - The id of the app that was initialized
	 * @param callback - The callback to run when the app is initialized
	 */
	onAppInitialized: (appId: string, callback: (data: Record<string, never>) => void) => void;
	/**
	 * Fired when an app is toggled on or off.
	 * @param appId - The id of the app that was toggled
	 * @param callback - The callback to run when the app is toggled
	 */
	onAppToggled: (appId: string, callback: (data: { state: boolean }) => void) => void;
};
export declare function normalizeCodegenDir(integrationName: string): string;
export declare function normalizeInjectedTypeFilename(
	filename: string,
	integrationName: string,
): string;
interface RunHookConfigSetup {
	settings: AstroSettings;
	command: 'dev' | 'build' | 'preview' | 'sync';
	logger: AstroLogger;
	isRestart?: boolean;
	fs?: typeof fsMod;
}
export declare function runHookConfigSetup({
	settings,
	command,
	logger,
	isRestart,
	fs,
}: RunHookConfigSetup): Promise<AstroSettings>;
export declare function runHookConfigDone({
	settings,
	logger,
	command,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
	command?: 'dev' | 'build' | 'preview' | 'sync';
}): Promise<void>;
export declare function runHookServerSetup({
	config,
	server,
	logger,
}: {
	config: AstroConfig;
	server: ViteDevServer;
	logger: AstroLogger;
}): Promise<void>;
export declare function runHookServerStart({
	config,
	address,
	logger,
}: {
	config: AstroConfig;
	address: AddressInfo;
	logger: AstroLogger;
}): Promise<void>;
export declare function runHookServerDone({
	config,
	logger,
}: {
	config: AstroConfig;
	logger: AstroLogger;
}): Promise<void>;
export declare function runHookBuildStart({
	settings,
	logger,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
}): Promise<void>;
export declare function runHookBuildSetup({
	config,
	vite,
	pages,
	target,
	logger,
}: {
	config: AstroConfig;
	vite: InlineConfig;
	pages: Map<string, PageBuildData>;
	target: 'server' | 'client';
	logger: AstroLogger;
}): Promise<InlineConfig>;
type RunHookBuildSsr = {
	config: AstroConfig;
	manifest: SerializedSSRManifest;
	logger: AstroLogger;
	middlewareEntryPoint: URL | undefined;
};
export declare function runHookBuildSsr({
	config,
	manifest,
	logger,
	middlewareEntryPoint,
}: RunHookBuildSsr): Promise<void>;
export declare function runHookBuildGenerated({
	settings,
	logger,
	routeToHeaders,
}: {
	settings: AstroSettings;
	logger: AstroLogger;
	routeToHeaders: RouteToHeaders;
}): Promise<void>;
type RunHookBuildDone = {
	settings: AstroSettings;
	pages: string[];
	routes: RouteData[];
	logger: AstroLogger;
};
export declare function runHookBuildDone({
	settings,
	pages,
	routes,
	logger,
}: RunHookBuildDone): Promise<void>;
export declare function runHookRouteSetup({
	route,
	settings,
	logger,
}: {
	route: RouteOptions;
	settings: AstroSettings;
	logger: AstroLogger;
}): Promise<void>;
export declare function runHookRoutesResolved({
	routes,
	settings,
	logger,
}: {
	routes: Array<RouteData>;
	settings: AstroSettings;
	logger: AstroLogger;
}): Promise<void>;
export declare function toIntegrationResolvedRoute(
	route: RouteData,
	trailingSlash: AstroConfig['trailingSlash'],
): IntegrationResolvedRoute;
export {};
