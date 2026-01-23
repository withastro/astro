import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { glob } from 'tinyglobby';
import whyIsNodeRunning from 'why-is-node-running';

const isCI = !!process.env.CI;
// 30 minutes in CI, 10 locally
const defaultTimeout = isCI ? 1860000 : 600000;
const maxListeners = 20;
// Watchdog timeout - dump handles and exit if tests hang (20 minutes)
const watchdogTimeout = 20 * 60 * 1000;

export default async function test() {
	process.setMaxListeners(maxListeners);
	const args = parseArgs({
		allowPositionals: true,
		options: {
			// aka --test-name-pattern: https://nodejs.org/api/test.html#filtering-tests-by-name
			match: { type: 'string', alias: 'm' },
			// aka --test-only: https://nodejs.org/api/test.html#only-tests
			only: { type: 'boolean', alias: 'o' },
			// aka --test-concurrency: https://nodejs.org/api/test.html#test-runner-execution-model
			parallel: { type: 'boolean', alias: 'p' },
			// experimental: https://nodejs.org/api/test.html#watch-mode
			watch: { type: 'boolean', alias: 'w' },
			// Test timeout in milliseconds (default: 30000ms)
			timeout: { type: 'string', alias: 't' },
			// Test setup file
			setup: { type: 'string', alias: 's' },
			// Test teardown file
			teardown: { type: 'string' },
			// Use tsx to run the tests,
			tsx: { type: 'boolean' },
			// Test teardown file to include in the test files list
			'teardown-test': { type: 'string' },
		},
	});

	const pattern = args.positionals[1];
	if (!pattern) throw new Error('Missing test glob pattern');

	const files = await glob(pattern, {
		filesOnly: true,
		absolute: true,
		ignore: ['**/node_modules/**'],
	});

	if (args.values['teardown-test']) {
		files.push(path.resolve(args.values['teardown-test']));
	}

	// For some reason, the `only` option does not work and we need to explicitly set the CLI flag instead.
	// Node.js requires opt-in to run .only tests :(
	// https://nodejs.org/api/test.html#only-tests
	if (args.values.only) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --test-only';
	}

	if (args.values.tsx) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --import tsx';
	}

	if (!args.values.parallel) {
		// If not parallel, we create a temporary file that imports all the test files
		// so that it all runs in a single process.
		const tempTestFile = path.resolve('./node_modules/.astro/test.mjs');
		await fs.mkdir(path.dirname(tempTestFile), { recursive: true });
		await fs.writeFile(
			tempTestFile,
			files.map((f) => `import ${JSON.stringify(pathToFileURL(f).toString())};`).join('\n'),
		);

		files.length = 0;
		files.push(tempTestFile);
	}

	const teardownModule = args.values.teardown
		? await import(pathToFileURL(path.resolve(args.values.teardown)).toString())
		: undefined;

	const setupModule = args.values.setup
		? await import(pathToFileURL(path.resolve(args.values.setup)).toString())
		: undefined;

	// Track in-progress tests to help debug hangs
	const inProgress = new Map();
	// Watchdog timer - if tests hang, dump open handles and force exit
	const watchdog = setTimeout(() => {
		console.log(`\n[test:watchdog] Tests timed out after ${watchdogTimeout / 1000}s`);
		console.log(`\n[test:watchdog] Tests still in progress:`);
		for (const [name, startTime] of inProgress) {
			const duration = ((Date.now() - startTime) / 1000).toFixed(1);
			console.log(`  - ${name} (running for ${duration}s)`);
		}
		console.log(`\n[test:watchdog] Open handles:`);
		whyIsNodeRunning();
		process.exit(1);
	}, watchdogTimeout);

	// https://nodejs.org/api/test.html#runoptions
	run({
		files,
		testNamePatterns: args.values.match
			? args.values['teardown-test']
				? [args.values.match, 'Teardown']
				: args.values.match
			: undefined,
		concurrency: args.values.parallel,
		only: args.values.only,
		setup: setupModule?.default,
		watch: args.values.watch,
		timeout: args.values.timeout ? Number(args.values.timeout) : defaultTimeout, // Node.js defaults to Infinity, so set better fallback
		forceExit: true, // Force exit even if there are open handles
	})
		.on('test:start', (event) => {
			inProgress.set(event.name, Date.now());
			if (isCI) {
				console.log(`[test:start] ${event.name}`);
			}
		})
		.on('test:pass', (event) => {
			inProgress.delete(event.name);
		})
		.on('test:fail', (event) => {
			inProgress.delete(event.name);
			// For some reason, a test fail using the JS API does not set an exit code of 1,
			// so we set it here manually
			process.exitCode = 1;
		})
		.on('end', () => {
			clearTimeout(watchdog);

			if (inProgress.size > 0) {
				console.log(`\n[test:warning] Tests that did not complete:`);
				for (const [name, startTime] of inProgress) {
					const duration = ((Date.now() - startTime) / 1000).toFixed(1);
					console.log(`  - ${name} (started ${duration}s ago)`);
				}
			}
			const testPassed = process.exitCode === 0 || process.exitCode === undefined;
			teardownModule?.default(testPassed);
		})
		.pipe(new spec())
		.pipe(process.stdout);
}
