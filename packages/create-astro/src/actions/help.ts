import { printHelp } from '../messages.js';

export function help() {
	printHelp({
		commandName: 'create-astro',
		usage: '[dir] [...flags]',
		headline: 'Scaffold Astro projects.',
		tables: {
			Flags: [
				['--help (-h)', 'Display available flags.'],
				['--template <name>', 'Specify a template.'],
				['--install / --no-install', 'Toggle dependency installation.'],
				['--git / --no-git', 'Toggle git repository initialization.'],
				['--yes (-y)', 'Accept all default prompts.'],
				['--no (-n)', 'Decline all default prompts.'],
				['--dry-run', 'Simulate steps without actual execution.'],
				['--skip-houston', 'Skip the Houston animation.'],
				['--ref', 'Specify an Astro branch (default: latest).'],
				['--fancy', 'Enable full Unicode support for Windows.'],
				['--typescript <option>', 'Choose a TypeScript option: strict, strictest, or relaxed.'],
			],
		},
	});
}
