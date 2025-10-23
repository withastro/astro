import { NonZeroExitError, x } from 'tinyexec';
import type { CommandExecutor } from '../definitions.js';

export function createTinyexecCommandExecutor(): CommandExecutor {
	return {
		async execute(command, args, options) {
			return await x(command, args, {
				throwOnError: true,
				nodeOptions: {
					cwd: options?.cwd,
					env: options?.env,
				},
			}).then(
				(o) => o,
				(e) => {
					if (e instanceof NonZeroExitError) {
						const fullCommand = args?.length
							? `${command} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`
							: command;
						const message = `The command \`${fullCommand}\` exited with code ${e.exitCode}`;
						const newError = new Error(message, e.cause ? { cause: e.cause } : undefined);
						(newError as any).stderr = e.output?.stderr;
						(newError as any).stdout = e.output?.stdout;
						throw newError;
					}
					throw e;
				},
			);
		},
	};
}
