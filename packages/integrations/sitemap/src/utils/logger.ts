// @internal
export interface ILogger {
	info(msg: string): void;
	success(msg: string): void;
	warn(msg: string): void;
	error(msg: string): void;
}

// @internal
export class Logger implements ILogger {
	private colors = {
		reset: '\x1b[0m',
		fg: {
			red: '\x1b[31m',
			green: '\x1b[32m',
			yellow: '\x1b[33m',
		},
	} as const;

	private packageName: string;

	constructor(packageName: string) {
		this.packageName = packageName;
	}

	private log(msg: string, prefix: string = '') {
		// eslint-disable-next-line no-console
		console.log(`%s${this.packageName}:%s ${msg}\n`, prefix, prefix ? this.colors.reset : '');
	}

	info(msg: string) {
		this.log(msg);
	}

	success(msg: string) {
		this.log(msg, this.colors.fg.green);
	}

	warn(msg: string) {
		this.log(`Skipped!\n${msg}`, this.colors.fg.yellow);
	}

	error(msg: string) {
		this.log(`Failed!\n${msg}`, this.colors.fg.red);
	}
}
