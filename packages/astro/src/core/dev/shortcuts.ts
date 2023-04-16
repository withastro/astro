import type { AstroSettings } from '../../@types/astro';
import { info } from '../logger/core.js';
import type { Container } from './container.js';
import type { DevOptions } from './dev.js';
import * as msg from '../messages.js';
import { restartContainer } from './restart.js';

export type Shortcut = {
	letter: string;
	description: string;
	action?: () => void;
};

export function listenForShortcuts({
	options,
	container,
	settings,
}: {
	options: DevOptions;
	container: Container;
	settings: AstroSettings;
}) {
	const shortcuts = [
		{
			letter: 'r',
			description: 'restart the server',
			action: () =>
				restartContainer({
					container,
					flags: options.flags ?? {},
					handleConfigError: options.handleConfigError,
					logMsg: 'Restarting...',
				}),
		},
		{
			letter: 'u',
			description: 'show server url',
			action: () =>
				info(
					options.logging,
					null,
					msg.serverUrls({
						resolvedUrls: container.viteServer.resolvedUrls || { local: [], network: [] },
						host: settings.config.server.host,
						base: settings.config.base,
					})
				),
		},
		{
			letter: 'o',
			description: 'open in browser',
			action: () => container.viteServer.openBrowser(),
		},
		{
			letter: 'h',
			description: 'show this help',
			action: () => {
				info(options.logging, null, msg.printShortcuts(shortcuts));
			},
		},
		{
			letter: 'q',
			description: 'quit',
		},
	];

	process.stdin.setRawMode(true); // read stdin by character instead of line
	process.stdin
		.on('data', (data) => {
			const char = data.toString();
			if (['q', '\x03', '\x04'].includes(char))
				return container.close().finally(() => process.exit(0));
			const shortcut = shortcuts.find((s) => s.letter === char);
			if (shortcut) shortcut.action?.();
		})
		.setEncoding('utf8')
		.resume();
}
