// Runs Turbo with the provided args and scopes filters to the PR base branch.
// For pull_request events, it appends the base...HEAD range to each --filter.
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const eventName = process.env.GITHUB_EVENT_NAME;
const baseRef = process.env.GITHUB_BASE_REF?.trim();
const isPullRequest = eventName === 'pull_request' || eventName === 'pull_request_target';

const range = isPullRequest && baseRef ? `origin/${baseRef}...HEAD` : undefined;

const isFilterFlag = (value) => value === '--filter' || value === '-F';
const hasRange = (value) => /\[[^\]]+\]/.test(value);

const formatFilter = (value) => {
	if (!range || hasRange(value)) return value;

	const isDirectoryFilter = value.startsWith('.') || value.startsWith('/');
	const wrapped = value.startsWith('{') ? value : isDirectoryFilter ? `{${value}}` : value;

	return `${wrapped}[${range}]`;
};

const turboArgs = [];
for (let i = 0; i < args.length; i += 1) {
	const arg = args[i];

	if (isFilterFlag(arg)) {
		const nextValue = args[i + 1];
		if (nextValue) {
			turboArgs.push(arg, formatFilter(nextValue));
			i += 1;
			continue;
		}
	}

	if (arg.startsWith('--filter=')) {
		const [, value] = arg.split('=', 2);
		turboArgs.push(`--filter=${formatFilter(value)}`);
		continue;
	}

	turboArgs.push(arg);
}

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs = ['exec', 'turbo', 'run', ...turboArgs];

console.log('[turbo-run-affected] platform:', process.platform);
console.log('[turbo-run-affected] event:', eventName ?? '(unknown)');
console.log('[turbo-run-affected] baseRef:', baseRef ?? '(none)');
console.log('[turbo-run-affected] range:', range ?? '(none)');
console.log('[turbo-run-affected] command:', pnpmCommand, commandArgs.join(' '));

const turbo = spawn(pnpmCommand, commandArgs, {
	stdio: 'inherit',
	env: process.env,
});

turbo.on('close', (code) => {
	process.exitCode = code ?? 1;
});
