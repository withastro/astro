import { type Flags } from '../flags.js';
interface PreferencesOptions {
	flags: Flags;
}
export declare function preferences(
	subcommand: string,
	key: string,
	value: string | undefined,
	{ flags }: PreferencesOptions,
): Promise<number>;
export {};
