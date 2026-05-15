import { options } from './options.js';
/**
 * Given a list of arguments from the command line (such as `process.argv`), return parsed and processed options
 */
export declare function parseArgsAsCheckConfig(args: string[]): {
	[x: string]: unknown;
	readonly root: string;
	readonly watch: boolean;
	readonly tsconfig: string | undefined;
	readonly minimumFailingSeverity: 'error' | 'warning' | 'hint';
	readonly minimumSeverity: 'error' | 'warning' | 'hint';
	readonly preserveWatchOutput: boolean;
	_: (string | number)[];
	$0: string;
};
export type Flags = Pick<ReturnType<typeof parseArgsAsCheckConfig>, keyof typeof options>;
export declare function check(
	flags: Partial<Flags> & {
		watch: true;
	},
): Promise<void>;
export declare function check(
	flags: Partial<Flags> & {
		watch: false;
	},
): Promise<boolean>;
export declare function check(flags: Partial<Flags>): Promise<boolean | void>;
