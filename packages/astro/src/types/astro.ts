import type { Server } from 'node:http';
import type { CspHash } from '../core/csp/config.js';
import type { AstroTimer } from '../core/config/timer.js';
import type { TSConfig } from '../core/config/tsconfig.js';
import type {
	AstroLogger,
	AstroLoggerLevel,
} from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
import type { AstroPreferences } from '../preferences/index.js';
import type { AstroConfig } from './public/config.js';
import type { ContentEntryType, DataEntryType } from './public/content.js';
import type {
	AstroAdapter,
	AstroPrerenderer,
	AstroPrerendererFactory,
	AstroRenderer,
	InjectedScriptStage,
	InjectedType,
} from './public/integrations.js';
import type { InternalInjectedRoute, ResolvedInjectedRoute } from './public/internal.js';
import type { DevToolbarAppEntry } from './public/toolbar.js';

export type {
	ComponentInstance,
	RoutesList,
	SerializedRouteData,
} from '@astrojs/vite-plugin-router';

export interface AstroSettings {
	config: AstroConfig;
	adapter: AstroAdapter | undefined;
	prerenderer: AstroPrerenderer | AstroPrerendererFactory | undefined;
	preferences: AstroPreferences;
	injectedRoutes: InternalInjectedRoute[];
	resolvedInjectedRoutes: ResolvedInjectedRoute[];
	pageExtensions: string[];
	contentEntryTypes: ContentEntryType[];
	dataEntryTypes: DataEntryType[];
	renderers: AstroRenderer[];
	scripts: {
		stage: InjectedScriptStage;
		content: string;
	}[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	devToolbarApps: (DevToolbarAppEntry | string)[];
	middlewares: { pre: string[]; post: string[] };
	tsConfig: TSConfig | undefined;
	tsConfigPath: string | undefined;
	watchFiles: string[];
	timer: AstroTimer;
	dotAstroDir: URL;
	/**
	 * Latest version of Astro, will be undefined if:
	 * - unable to check
	 * - the user has disabled the check
	 * - the check has not completed yet
	 * - the user is on the latest version already
	 */
	latestAstroVersion: string | undefined;
	// This makes content optional. Internal only so it's not optional on InjectedType
	injectedTypes: Array<Omit<InjectedType, 'content'> & Partial<Pick<InjectedType, 'content'>>>;
	/**
	 * Determine if the build output should be a static, dist folder or an adapter-based server output
	 * undefined when unknown
	 */
	buildOutput: undefined | 'static' | 'server';
	injectedCsp: {
		fontResources: Set<string>;
		styleHashes: CspHash[];
	};
	logLevel: AstroLoggerLevel;
	fontsHttpServer: Server | null;
}

export interface AstroPluginOptions {
	settings: AstroSettings;
	logger: AstroLogger;
}

export type { ImportedDevStyle } from '@astrojs/vite-plugin-router';
