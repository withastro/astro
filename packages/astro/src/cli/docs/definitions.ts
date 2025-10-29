import type { StdioOptions } from 'node:child_process';
import type { CloudIde } from './domain/cloud-ide.js';

export interface CommandExecutor {
	execute: (
		command: string,
		args?: Array<string>,
		options?: {
			cwd?: string;
			env?: Record<string, string | undefined>;
			shell?: boolean;
			input?: string;
			stdio?: StdioOptions;
		},
	) => Promise<{ stdout: string }>;
}

export interface CloudIdeProvider {
	getName: () => CloudIde | null;
}
