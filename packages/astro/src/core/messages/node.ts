/**
 * Node.js-specific prestyled messages for the CLI.
 * These functions use Node.js APIs and should not be imported in runtime-agnostic code.
 */
import { detect, resolveCommand } from 'package-manager-detector';
import colors from 'piccolore';

const { bgYellow, black, cyan, yellow } = colors;

export async function newVersionAvailable({ latestVersion }: { latestVersion: string }) {
	const badge = bgYellow(black(` update `));
	const headline = yellow(`▶ New version of Astro available: ${latestVersion}`);
	const packageManager = (await detect())?.agent ?? 'npm';
	const execCommand = resolveCommand(packageManager, 'execute', ['@astrojs/upgrade']);
	// NOTE: Usually it's impossible for `execCommand` to be null as `package-manager-detector` should
	// already match a valid package manager
	const details = !execCommand
		? ''
		: `  Run ${cyan(`${execCommand.command} ${execCommand.args.join(' ')}`)} to update`;
	return ['', `${badge} ${headline}`, details, ''].join('\n');
}
