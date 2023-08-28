export interface Options {
	port?: number;
	hostname?: string;
	start?: boolean;
}

export interface BuildConfig {
	server: URL;
	serverEntry: string;
	assets: string;
}
