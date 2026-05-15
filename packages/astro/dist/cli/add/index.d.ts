import { type Flags } from '../flags.js';
interface AddOptions {
	flags: Flags;
}
export declare function add(names: string[], { flags }: AddOptions): Promise<void>;
export {};
