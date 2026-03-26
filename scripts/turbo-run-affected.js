// Runs Turbo with the provided args and scopes filters to the PR base branch.
// For pull_request events, it appends the base...HEAD range to each --filter.
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const eventName = process.env.GITHUB_EVENT_NAME;
const baseRef = process.env.GITHUB_BASE_REF?.trim();
const isPullRequest = eventName === 'pull_request' || eventName === 'pull_request_target';

// Only scope to changed packages when CI runs in a PR context.
// On pushes or local runs we pass filters through unchanged.
const range = isPullRequest && baseRef ? `origin/${baseRef}...HEAD` : undefined;

const isFilterFlag = (value) => value === '--filter' || value === '-F';
const hasRange = (value) => /\[[^\]]+\]/.test(value);

const formatFilter = (value) => {
	if (!range || hasRange(value)) return value;

	// Turbo needs directory filters wrapped in braces before appending [range].
	// Example: ./packages/astro -> {./packages/astro}[origin/main...HEAD]
	const isDirectoryFilter = value.startsWith('.') || value.startsWith('/');
	const wrapped = value.startsWith('{') ? value : isDirectoryFilter ? `{${value}}` : value;

	return `${wrapped}[${range}]`;
};

// Rewrite any filter args to include [base...HEAD] while preserving
// all other Turbo arguments exactly as provided.
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

// On Windows, spawn via the shell so command resolution handles pnpm.cmd.
const isWindows = process.platform === 'win32';
const pnpmCommand = 'pnpm';
const commandArgs = ['exec', 'turbo', 'run', ...turboArgs];

console.info('[turbo-run-affected] platform:', process.platform);
console.info('[turbo-run-affected] event:', eventName ?? '(unknown)');
console.info('[turbo-run-affected] baseRef:', baseRef ?? '(none)');
console.info('[turbo-run-affected] range:', range ?? '(none)');
console.info('[turbo-run-affected] command:', pnpmCommand, commandArgs.join(' '));

const turbo = spawn(pnpmCommand, commandArgs, {
	stdio: 'inherit',
	env: process.env,
	shell: isWindows,
});

// Mirror Turbo's exit status so CI fails/succeeds correctly.
turbo.on('close', (code) => {
	process.exitCode = code ?? 1;
});
