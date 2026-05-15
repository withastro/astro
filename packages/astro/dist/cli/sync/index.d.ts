import { type Flags } from '../flags.js';
interface SyncOptions {
	flags: Flags;
}
export declare function sync({ flags }: SyncOptions): Promise<0 | undefined>;
export {};
