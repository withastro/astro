import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { prompt } from '@astrojs/cli-kit';
import detectPackageManager from 'preferred-pm';

export interface Context {
	help: boolean;
	prompt: typeof prompt;
	version: string;
	dryRun: boolean;
	cwd: URL;
	stdin?: typeof process.stdin;
	stdout?: typeof process.stdout;
	packageManager: string;
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
	const args = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: false,
		options: {
			'dry-run': { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
		},
	});

	const packageManager = (await detectPackageManager(process.cwd()))?.name ?? 'npm';
	const version = args.positionals[0] ?? 'latest';
	const help = !!args.values.help;
	const dryRun = !!args.values['dry-run'];

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
