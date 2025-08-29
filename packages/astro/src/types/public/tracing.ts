import type { AstroGlobal } from './context.js';
import type { RouteData } from './internal.js';

export interface TraceEventsPayloads {
	instantiateComponent: {
		moduleId?: string;
		componentName: string;
		displayName: string;
		request: AstroGlobal['request'];
		response: AstroGlobal['response'];
	};
	componentFrontmatter: {
		moduleId?: string;
		name: string;
		request: AstroGlobal['request'];
		response: AstroGlobal['response'];
	};
	componentRender: {
		moduleId?: string;
		componentName: string;
		displayName: string;
		request: AstroGlobal['request'];
		response: AstroGlobal['response'];
	};
	slotRender: {
		slotName: string;
		componentModuleId?: string;
		componentName: string;
	};
	routeRender: {
		rootModuleId?: string;
		request: Request;
		clientAddress?: string;
		pathname: string;
		routeData: RouteData;
		url: URL;
		partial?: boolean;
	};
	middleware: {
		name: string;
		pathname: string;
		url: URL;
		request: Request;
	};

	// Allow for events to be added in a backwards-compatible way.
	// Trace listeners must handle unknown events gracefully in order to be type-safe.
	// TODO: Think of something that allows forward compatibility without losing type safety.
	// [k: string]: Record<string, unknown>;
}

export type TraceEvent = {
	[K in keyof TraceEventsPayloads]: {
		event: K;
		payload: TraceEventsPayloads[K];
	};
}[keyof TraceEventsPayloads];

export type TraceListener = (event: TraceEvent, callback: (() => void | Promise<void>)) => void;
