export declare const options: {
	readonly root: {
		readonly type: 'string';
		readonly default: string;
		readonly description: 'Manually specify a root dir to check in. By default, the current working directory is used.';
	};
	readonly watch: {
		readonly type: 'boolean';
		readonly default: false;
		readonly alias: 'w';
	};
	readonly tsconfig: {
		readonly type: 'string';
		readonly description: "Manually specify a path to a `tsconfig.json` or `jsconfig.json` to use. If not specified, the program will attempt to find a config, if it cannot it'll attempt to automatically infer the project's configuration.";
		readonly default: undefined;
	};
	readonly minimumFailingSeverity: {
		readonly choices: readonly ['error', 'warning', 'hint'];
		readonly description: "Minimum error severity needed to exit with an error code. Choosing 'hint' will for example cause the program to exit with an error if there's any unfixed hints.";
		readonly default: 'error';
	};
	readonly minimumSeverity: {
		readonly choices: readonly ['error', 'warning', 'hint'];
		readonly description: 'Minimum diagnostic severity to show. Choosing `warning` will, for example, show both errors and warnings, but not hints. ';
		readonly default: 'hint';
	};
	readonly preserveWatchOutput: {
		readonly type: 'boolean';
		readonly description: "If set to false, output won't be cleared between checks in watch mode.";
		readonly default: false;
	};
};
