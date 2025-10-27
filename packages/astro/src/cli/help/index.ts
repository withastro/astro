import type { HelpPayload } from '../domain/help-payload.js';

export const DEFAULT_HELP_PAYLOAD: HelpPayload = {
	commandName: 'astro',
	usage: '[command] [...flags]',
	headline: 'Build faster websites.',
	tables: {
		Commands: [
			['add', 'Add an integration.'],
			['build', 'Build your project and write it to disk.'],
			['check', 'Check your project for errors.'],
			['create-key', 'Create a cryptography key'],
			['db', 'Manage your Astro database.'],
			['dev', 'Start the development server.'],
			['docs', 'Open documentation in your web browser.'],
			['info', 'List info about your current Astro setup.'],
			['preview', 'Preview your build locally.'],
			['sync', 'Generate content collection types.'],
			['preferences', 'Configure user preferences.'],
			['telemetry', 'Configure telemetry settings.'],
		],
		'Global Flags': [
			['--config <path>', 'Specify your config file.'],
			['--root <path>', 'Specify your project root folder.'],
			['--site <url>', 'Specify your project site.'],
			['--base <pathname>', 'Specify your project base.'],
			['--verbose', 'Enable verbose logging.'],
			['--silent', 'Disable all logging.'],
			['--version', 'Show the version number and exit.'],
			['--help', 'Show this help message.'],
		],
	},
};
