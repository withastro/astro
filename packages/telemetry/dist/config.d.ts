interface ConfigOptions {
	name: string;
}
export declare class GlobalConfig {
	private project;
	private dir;
	private file;
	constructor(project: ConfigOptions);
	private _store?;
	private get store();
	private set store(value);
	private ensureDir;
	write(): void;
	clear(): void;
	delete(key: string): boolean;
	get(key: string): any;
	has(key: string): boolean;
	set(key: string, value: any): void;
}
export {};
