import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { glob } from 'tinyglobby';
import githubTestReporter from '../testing/github-test-reporter.js';

const isCI = !!process.env.CI;
// 30 minutes in CI, 10 locally
const defaultTimeout = isCI ? 1860000 : 600000;

export default async function test() {
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
			// Use Node.js experimental strip types to run TypeScript tests
			'strip-types': { type: 'boolean' },
			// Configures the test runner to exit the process once all known tests have finished executing even if the event loop would otherwise remain active
			'force-exit': { type: 'boolean' },
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
		// On Node.js < 22, `--experimental-strip-types` isn't available, so a TS
		// setup file (e.g. `astro-scripts test --setup foo.ts`) needs tsx to load.
		// The setup module is imported in the current process, and `NODE_OPTIONS`
		// only applies to child processes, so we must also register tsx here.
		// Remove once we drop Node.js 20 support.
		const nodeMajor = Number(process.versions.node.split('.')[0]);
		if (nodeMajor < 22) {
			const { register } = await import('tsx/esm/api');
			register();
		}
	}

	if (args.values['strip-types']) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --experimental-strip-types';
	}

	if (args.values.parallel) {
		// Signal to test-utils that we're in parallel mode so it can use port 0
		// (OS-assigned) to avoid port collisions across parallel worker processes.
		process.env.ASTRO_TEST_PARALLEL = '1';
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

	// https://nodejs.org/api/test.html#runoptions
	const testRun = run({
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
		forceExit: args.values['force-exit'],
	})
		.on('test:fail', () => {
			// For some reason, a test failure using the JS API does not set an exit code of 1,
			// so we set it here manually
			process.exitCode = 1;
		})
		.on('end', () => {
			const testPassed = process.exitCode === 0 || process.exitCode === undefined;
			teardownModule?.default(testPassed);
		});

	// Pipe to our custom GitHub reporter, and also the default spec reporter for terminal output
	if (process.env.CI) testRun.pipe(githubTestReporter);
	testRun.pipe(new spec()).pipe(process.stdout);
}
