import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import arg from 'arg';
import glob from 'tiny-glob';

export default async function prebuild() {
	const args = arg({
		'--match': String,
		'--only': Boolean,
		'--parallel': Boolean,
		'--watch': Boolean,
		'--timeout': Number,
		'--setup': String,
		'-m': '--match',
		'-o': '--only',
		'-p': '--parallel',
		'-w': '--watch',
		'-t': '--timeout',
		'-s': '--setup',
	});

	const pattern = args._[1];
	if (!pattern) throw new Error('Missing test glob pattern');

	const files = await glob(pattern, { filesOnly: true, absolute: true });

	// For some reason, the `only` option does not work and we need to explicitly set the CLI flag instead.
	// Node.js requires opt-in to run .only tests :(
	// https://nodejs.org/api/test.html#only-tests
	if (args['--only']) {
		process.env.NODE_OPTIONS ??= '';
		process.env.NODE_OPTIONS += ' --test-only';
	}

	run({
		files,
		testNamePatterns: args['--match'],
		concurrency: args['--parallel'],
		only: args['--only'],
		setup: args['--setup'],
		watch: args['--watch'],
		timeout: args['--timeout'],
	})
		.pipe(new spec())
		.pipe(process.stdout);
}
