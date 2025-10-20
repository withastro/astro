export const options = {
	root: {
		type: 'string',
		default: process.cwd(),
		description:
			'Manually specify a root dir to check in. By default, the current working directory is used.',
	},
	watch: { type: 'boolean', default: false, alias: 'w' },
	tsconfig: {
		type: 'string',
		description:
			"Manually specify a path to a `tsconfig.json` or `jsconfig.json` to use. If not specified, the program will attempt to find a config, if it cannot it'll attempt to automatically infer the project's configuration.",
		default: undefined,
	},
	minimumFailingSeverity: {
		choices: ['error', 'warning', 'hint'] as const,
		description:
			"Minimum error severity needed to exit with an error code. Choosing 'hint' will for example cause the program to exit with an error if there's any unfixed hints.",
		default: 'error',
	},
	minimumSeverity: {
		choices: ['error', 'warning', 'hint'] as const,
		description:
			'Minimum diagnostic severity to show. Choosing `warning` will, for example, show both errors and warnings, but not hints. ',
		default: 'hint',
	},
	preserveWatchOutput: {
		type: 'boolean',
		description: "If set to false, output won't be cleared between checks in watch mode.",
		default: false,
	},
} as const;
