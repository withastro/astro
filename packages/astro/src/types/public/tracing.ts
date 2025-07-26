import type { AstroGlobal } from './context.js';
import type { RouteData } from './internal.js';

export interface TraceEvents {
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
}

export type EventArgs = {
	[K in keyof TraceEvents]: [event: K, payload: TraceEvents[K]];
}[keyof TraceEvents];

export type TraceListener = (...args: EventArgs) => void;
