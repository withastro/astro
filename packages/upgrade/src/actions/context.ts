import { pathToFileURL } from 'node:url';
import { prompt } from '@astrojs/cli-kit';
import arg from 'arg';
import { type DetectResult, detect } from 'package-manager-detector';

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

export async function getContext(argv: string[]): Promise<Context> {
	const flags = arg(
		{
			'--dry-run': Boolean,
			'--help': Boolean,

			'-h': '--help',
		},
		{ argv, permissive: true },
	);

	const packageManager = (await detect({
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	})) ?? { agent: 'npm', name: 'npm' };
	const { _: [version = 'latest'] = [], '--help': help = false, '--dry-run': dryRun } = flags;

	return {
		help,
		prompt,
		packageManager,
		packages: [],
		cwd: new URL(pathToFileURL(process.cwd()) + '/'),
		dryRun,
		version,
		exit(code) {
			process.exit(code);
		},
	} satisfies Context;
}
