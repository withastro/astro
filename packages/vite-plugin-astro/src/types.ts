export interface AstroConfigLike {
	root: URL;
	srcDir: URL;
	publicDir: URL;
	base: string;
	site?: string;
	trailingSlash?: 'always' | 'never' | 'ignore';
	compressHTML?: boolean | 'jsx';
	scopedStyleStrategy?: 'where' | 'class' | 'attribute';
	devToolbar?: { enabled?: boolean };
	build?: { format?: 'file' | 'directory' | 'preserve' };
}

export interface AstroSettingsLike {
	config: AstroConfigLike;
	preferences: {
		get(key: string): Promise<unknown>;
	};
}

export interface LoggerLike {
	info(label: string | null, message: string, newLine?: boolean): void;
	warn(label: string | null, message: string): void;
	error(label: string | null, message: string): void;
	debug(label: string | null, message: string): void;
}

export type PropagationHint = 'none' | 'self' | 'in-tree';

export interface ModuleInfo {
	id: string;
	meta?: Record<string, unknown>;
}
