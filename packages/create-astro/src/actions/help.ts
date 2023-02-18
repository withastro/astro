import { printHelp } from '../messages.js';

export function help() {
	printHelp({
		commandName: 'create-astro',
		usage: '[dir] [...flags]',
		headline: 'Scaffold Astro projects.',
		tables: {
			Flags: [
				['--template <name>', 'Specify your template.'],
				['--install / --no-install', 'Install dependencies (or not).'],
				['--git / --no-git', 'Initialize git repo (or not).'],
				['--yes (-y)', 'Skip all prompt by accepting defaults.'],
				['--no (-n)', 'Skip all prompt by declining defaults.'],
				['--dry-run', 'Walk through steps without executing.'],
				['--skip-houston', 'Skip Houston animation.'],
				['--typescript <option>', 'TypeScript option: strict | strictest | relaxed.'],
			],
		},
	});
}
