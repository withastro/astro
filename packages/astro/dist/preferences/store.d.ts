export declare class PreferenceStore {
	private dir;
	private file;
	constructor(dir: string, filename?: string);
	private _store?;
	private get store();
	private set store(value);
	write(): void;
	clear(): void;
	delete(key: string): boolean;
	get(key: string): any;
	has(key: string): boolean;
	set(key: string, value: any): void;
	getAll(): Record<string, any>;
}
