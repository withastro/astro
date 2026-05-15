import type { Storage } from '../definitions.js';
export declare class UnstorageFsStorage implements Storage {
	#private;
	constructor({ base }: { base: URL });
	getItem(key: string): Promise<any | null>;
	getItemRaw(key: string): Promise<Buffer | null>;
	setItem(key: string, value: any): Promise<void>;
	setItemRaw(key: string, value: any): Promise<void>;
}
