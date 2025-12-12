export interface SessionDriver {
	removeItem: (key: string) => Promise<void>;
	get: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
}

export interface SessionDriverConfig {
	name: string;
	options?: Record<string, any> | undefined;
	entrypoint: string | URL;
}

export interface ResolvedSessionDriverConfig {
	name: string;
	options: Record<string, any> | undefined;
	entrypoint: URL;
}
