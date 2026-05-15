import { detect, resolveCommand } from 'package-manager-detector';
import colors from 'piccolore';
const { bgYellow, black, cyan, yellow } = colors;
async function newVersionAvailable({ latestVersion }) {
	const badge = bgYellow(black(` update `));
	const headline = yellow(`\u25B6 New version of Astro available: ${latestVersion}`);
	const packageManager = (await detect())?.agent ?? 'npm';
	const execCommand = resolveCommand(packageManager, 'execute', ['@astrojs/upgrade']);
	const details = !execCommand
		? ''
		: `  Run ${cyan(`${execCommand.command} ${execCommand.args.join(' ')}`)} to update`;
	return ['', `${badge} ${headline}`, details, ''].join('\n');
}
export { newVersionAvailable };
