import { type Flags } from '../flags.js';
interface BuildOptions {
	flags: Flags;
}
export declare function build({ flags }: BuildOptions): Promise<void>;
export {};
