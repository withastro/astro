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

export type PropagationHint = 'none' | 'self' | 'in-tree';

export interface ModuleInfo {
	id: string;
	meta?: Record<string, unknown>;
}

export type Transform = (filename: string, code: string) => string;
