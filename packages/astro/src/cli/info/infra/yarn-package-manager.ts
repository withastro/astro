import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';

interface YarnVersionOutputLine {
	children: Record<string, { locator: string }>;
}

function getYarnOutputDepVersion(dependency: string, outputLine: string) {
	const parsed = JSON.parse(outputLine) as YarnVersionOutputLine;

	for (const [key, value] of Object.entries(parsed.children)) {
		if (key.startsWith(`${dependency}@`)) {
			return `v${value.locator.split(':').pop()}`;
		}
	}
}

export class YarnPackageManager implements PackageManager {
	readonly name: string = 'yarn';
	readonly #commandExecutor: CommandExecutor;

	constructor({ commandExecutor }: { commandExecutor: CommandExecutor }) {
		this.#commandExecutor = commandExecutor;
	}

	async getPackageVersion(name: string): Promise<string | undefined> {
		try {
			// https://yarnpkg.com/cli/why
			const { stdout } = await this.#commandExecutor.execute('yarn', ['why', name, '--json'], {
				shell: true,
			});

			const hasUserDefinition = stdout.includes('workspace:.');

			/* output is NDJSON: one line contains a json object. For example:
				
				{"type":"step","data":{"message":"Why do we have the module \"hookable\"?","current":1,"total":4}}
				{"type":"step","data":{"message":"Initialising dependency graph","current":2,"total":4}}
				{"type":"activityStart","data":{"id":0}}
				{"type":"activityTick","data":{"id":0,"name":"hookable@^5.5.3"}}
				{"type":"activityEnd","data":{"id":0}}
				{"type":"step","data":{"message":"Finding dependency","current":3,"total":4}}
				{"type":"step","data":{"message":"Calculating file sizes","current":4,"total":4}}
				{"type":"info","data":"\r=> Found \"hookable@5.5.3\""}
				{"type":"info","data":"Has been hoisted to \"hookable\""}
				{"type":"info","data":"This module exists because it's specified in \"dependencies\"."}
				{"type":"info","data":"Disk size without dependencies: \"52KB\""}
				{"type":"info","data":"Disk size with unique dependencies: \"52KB\""}
				{"type":"info","data":"Disk size with transitive dependencies: \"52KB\""}
				{"type":"info","data":"Number of shared dependencies: 0"}
				 */
			for (const line of stdout.split('\n')) {
				if (hasUserDefinition && line.includes('workspace:.'))
					return getYarnOutputDepVersion(name, line);
				if (!hasUserDefinition && line.includes('astro@'))
					return getYarnOutputDepVersion(name, line);
			}
		} catch {
			return undefined;
		}
	}
}
