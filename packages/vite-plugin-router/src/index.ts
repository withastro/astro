export { ROUTER_PLUGIN_DEFAULTS } from './defaults.js';
export {
	RouterBuildOptionsSchema,
	type RouterPluginOptions,
	RouterPluginOptionsSchema,
	RouterSecurityOptionsSchema,
	type ResolvedRouterPluginOptions,
} from './options.js';
export {
	type BuildDoneResult,
	default,
	type FetchHandlerDefinition,
	getRouterApi,
	type InjectRouteOptions,
	type RouterPluginApi,
	type PageScriptOptions,
} from './internal/plugin.js';
export type { RouterConfig } from './config.js';
export type { ServerOutputOptions } from './internal/vite-plugin-server-output/index.js';
export type * from './context.js';
export type * from './routing.js';
export type * from './types.js';
