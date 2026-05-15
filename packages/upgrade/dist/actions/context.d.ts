import { prompt } from '@astrojs/cli-kit';
import { type DetectResult } from 'package-manager-detector';
export interface Context {
	help: boolean;
	prompt: typeof prompt;
	version: string;
	dryRun?: boolean;
	cwd: URL;
	stdin?: typeof process.stdin;
	stdout?: typeof process.stdout;
	packageManager: DetectResult;
	packages: PackageInfo[];
	exit(code: number): never;
}
export interface PackageInfo {
	name: string;
	currentVersion: string;
	targetVersion: string;
	tag?: string;
	isDevDependency?: boolean;
	isMajor?: boolean;
	changelogURL?: string;
	changelogTitle?: string;
}
export declare function getContext(argv: string[]): Promise<Context>;
