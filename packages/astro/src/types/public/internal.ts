// TODO: Should the types here really be public?

import type { InjectedRoute, RouteData } from '@astrojs/vite-plugin-router';
import type { AstroGlobal } from './context.js';

export type { SSRActions } from '../../core/app/types.js';
export type {
	SSRManifest,
	SSRManifestCSP,
} from '@astrojs/vite-plugin-router/_internal/core/app/types.js';
export type {
	AstroComponentMetadata,
	AsyncRendererComponentFn,
	NamedSSRLoadedRendererValue,
	PropagationHint,
	SSRComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRLoadedRendererValue,
	SSRMetadata,
	SSRResult,
} from '@astrojs/vite-plugin-astro';
export type { RouteData, RoutePart, RouteType } from '@astrojs/vite-plugin-router';

declare module '@astrojs/vite-plugin-astro' {
	interface SSRResultExtensions {
		actionResult?: ReturnType<AstroGlobal['getActionResult']>;
	}
}

export type { SSRError } from '@astrojs/vite-plugin-router';

// `origin` is set within the hook, but the user doesn't have access to this property. That's why
// we need an intermediary interface
export interface InternalInjectedRoute extends InjectedRoute {
	origin: RouteData['origin'];
}

export interface ResolvedInjectedRoute extends InternalInjectedRoute {
	resolvedEntryPoint?: URL;
}
