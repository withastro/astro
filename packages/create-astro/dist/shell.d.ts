import type { StdioOptions } from 'node:child_process';
interface ExecaOptions {
	cwd?: string | URL;
	stdio?: StdioOptions;
	timeout?: number;
}
interface Output {
	stdout: string;
	stderr: string;
	exitCode: number;
}
export declare function shell(
	command: string,
	flags: string[],
	opts?: ExecaOptions,
): Promise<Output>;
export {};
