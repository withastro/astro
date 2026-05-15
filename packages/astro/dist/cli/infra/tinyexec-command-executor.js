import { NonZeroExitError, x } from 'tinyexec';
class TinyexecCommandExecutor {
	async execute(command, args, options) {
		const proc = x(command, args, {
			throwOnError: true,
			nodeOptions: {
				cwd: options?.cwd,
				env: options?.env,
				shell: options?.shell,
				stdio: options?.stdio,
			},
		});
		if (options?.input) {
			proc.process?.stdin?.end(options.input);
		}
		return await proc.then(
			(o) => o,
			(e) => {
				if (e instanceof NonZeroExitError) {
					const fullCommand = args?.length
						? `${command} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`
						: command;
					const message = `The command \`${fullCommand}\` exited with code ${e.exitCode}`;
					const newError = new Error(message, e.cause ? { cause: e.cause } : void 0);
					newError.stderr = e.output?.stderr;
					newError.stdout = e.output?.stdout;
					throw newError;
				}
				throw e;
			},
		);
	}
}
export { TinyexecCommandExecutor };
