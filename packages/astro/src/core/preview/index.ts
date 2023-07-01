import { cyan } from 'kleur/colors';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import type { Arguments } from 'yargs-parser';
import type { AstroSettings, PreviewModule, PreviewServer } from '../../@types/astro';
import { runHookConfigDone, runHookConfigSetup } from '../../integrations/index.js';
import type { LogOptions } from '../logger/core';
import { printHelp } from '../messages.js';
import createStaticPreviewServer from './static-preview-server.js';
import { getResolvedHostForHttpServer } from './util.js';

interface PreviewOptions {
	logging: LogOptions;
	flags?: Arguments;
}

/** The primary dev action */
export default async function preview(
	_settings: AstroSettings,
	{ logging, flags }: PreviewOptions
): Promise<PreviewServer | undefined> {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro preview',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--open', 'Automatically open the app in the browser on server start'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Starts a local server to serve your static dist/ directory. Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-preview'
			)} for more information.`,
		});
		return;
	}

	const settings = await runHookConfigSetup({
		settings: _settings,
		command: 'preview',
		logging: logging,
	});
	await runHookConfigDone({ settings: settings, logging: logging });

	if (settings.config.output === 'static') {
		const server = await createStaticPreviewServer(settings, logging);
		return server;
	}
	if (!settings.adapter) {
		throw new Error(`[preview] No adapter found.`);
	}
	if (!settings.adapter.previewEntrypoint) {
		throw new Error(
			`[preview] The ${settings.adapter.name} adapter does not support the preview command.`
		);
	}
	// We need to use require.resolve() here so that advanced package managers like pnpm
	// don't treat this as a dependency of Astro itself. This correctly resolves the
	// preview entrypoint of the integration package, relative to the user's project root.
	const require = createRequire(settings.config.root);
	const previewEntrypointUrl = pathToFileURL(
		require.resolve(settings.adapter.previewEntrypoint)
	).href;

	const previewModule = (await import(previewEntrypointUrl)) as Partial<PreviewModule>;
	if (typeof previewModule.default !== 'function') {
		throw new Error(`[preview] ${settings.adapter.name} cannot preview your app.`);
	}

	const server = await previewModule.default({
		outDir: settings.config.outDir,
		client: settings.config.build.client,
		serverEntrypoint: new URL(settings.config.build.serverEntry, settings.config.build.server),
		host: getResolvedHostForHttpServer(settings.config.server.host),
		port: settings.config.server.port,
		base: settings.config.base,
	});

	return server;
}
