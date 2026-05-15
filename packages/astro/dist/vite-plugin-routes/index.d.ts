import type fsMod from 'node:fs';
import { type Plugin } from 'vite';
import type { SerializedRouteInfo } from '../core/app/types.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
type Payload = {
	settings: AstroSettings;
	logger: AstroLogger;
	fsMod?: typeof fsMod;
	routesList: RoutesList;
	command: 'dev' | 'build';
};
export declare const ASTRO_ROUTES_MODULE_ID = 'virtual:astro:routes';
/**
 * In dev mode, populate route scripts with integration-injected scripts from settings.
 * This ensures non-runnable environments (e.g. Cloudflare's workerd) can access
 * scripts injected via `injectScript()` during `astro:config:setup`.
 */
export declare function getDevRouteScripts(
	command: 'dev' | 'build',
	scripts: AstroSettings['scripts'],
): SerializedRouteInfo['scripts'];
export default function astroPluginRoutes({
	settings,
	logger,
	fsMod,
	routesList: initialRoutesList,
	command,
}: Payload): Promise<Plugin>;
export {};
