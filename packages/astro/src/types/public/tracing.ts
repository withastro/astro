export interface TraceEvents {
	componentFrontmatter: {
		moduleId?: string;
		name: string;
	};
	componentRender: {
		moduleId?: string;
		componentName: string;
		displayName: string;
	};
	slotRender: { slotName: string; };
}

export type TraceListener = <T extends keyof TraceEvents>(event: T, payload: TraceEvents[T]) => void;
