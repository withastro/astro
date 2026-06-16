export type PropagationHint = 'none' | 'self' | 'in-tree';

export interface ModuleInfo {
	id: string;
	meta?: Record<string, unknown>;
}

export type Transform = (filename: string, code: string) => string;
