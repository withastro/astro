import nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as vite from 'vite';
import type { AstroInlineConfig, AstroSettings } from '../../@types/astro';
import { eventCliSession, telemetry } from '../../events/index.js';
import { createNodeLogging, createSettings, resolveConfig } from '../config/index.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import { isAstroConfigZodError } from '../errors/errors.js';
import { createSafeError } from '../errors/index.js';
import { info, error as logError } from '../logger/core.js';
import { formatErrorMessage } from '../messages.js';
import type { Container } from './container';
import { createContainer, startContainer } from './container.js';

async function createRestartedContainer(
	container: Container,
	settings: AstroSettings
): Promise<Container> {
	const { logging, fs, inlineConfig } = container;
	const newContainer = await createContainer({
		isRestart: true,
		logging,
		settings,
		inlineConfig,
		fs,
	});

	await startContainer(newContainer);

	return newContainer;
}

export function shouldRestartContainer(
	{ settings, inlineConfig, restartInFlight }: Container,
	changedFile: string
): boolean {
	if (restartInFlight) return false;

	let shouldRestart = false;

	// If the config file changed, reload the config and restart the server.
	if (inlineConfig.configFile) {
		shouldRestart = vite.normalizePath(inlineConfig.configFile) === vite.normalizePath(changedFile);
	}
	// Otherwise, watch for any astro.config.* file changes in project root
	else {
		const exp = new RegExp(`.*astro\.config\.((mjs)|(cjs)|(js)|(ts))$`);
		const normalizedChangedFile = vite.normalizePath(changedFile);
		shouldRestart = exp.test(normalizedChangedFile);
	}

	if (!shouldRestart && settings.watchFiles.length > 0) {
		// If the config file didn't change, check if any of the watched files changed.
		shouldRestart = settings.watchFiles.some(
			(path) => vite.normalizePath(path) === vite.normalizePath(changedFile)
		);
	}

	return shouldRestart;
}

export async function restartContainer(container: Container): Promise<Container | Error> {
	const { logging, close, settings: existingSettings } = container;
	container.restartInFlight = true;

	try {
		const { astroConfig } = await resolveConfig(container.inlineConfig, 'dev', container.fs);
		const settings = createSettings(astroConfig, fileURLToPath(existingSettings.config.root));
		await close();
		return await createRestartedContainer(container, settings);
	} catch (_err) {
		const error = createSafeError(_err);
		// Print all error messages except ZodErrors from AstroConfig as the pre-logged error is sufficient
		if (!isAstroConfigZodError(_err)) {
			logError(logging, 'config', formatErrorMessage(collectErrorMetadata(error)) + '\n');
		}
		// Inform connected clients of the config error
		container.viteServer.ws.send({
			type: 'error',
			err: {
				message: error.message,
				stack: error.stack || '',
			},
		});
		container.restartInFlight = false;
		info(logging, 'astro', 'Continuing with previous valid configuration\n');
		return error;
	}
}

export interface CreateContainerWithAutomaticRestart {
	inlineConfig?: AstroInlineConfig;
	fs: typeof nodeFs;
}

interface Restart {
	container: Container;
	restarted: () => Promise<Error | null>;
}

export async function createContainerWithAutomaticRestart({
	inlineConfig,
	fs,
}: CreateContainerWithAutomaticRestart): Promise<Restart> {
	const logging = createNodeLogging(inlineConfig ?? {});
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev', fs);
	telemetry.record(eventCliSession('dev', userConfig));

	const settings = createSettings(astroConfig, fileURLToPath(astroConfig.root));

	const initialContainer = await createContainer({ settings, logging, inlineConfig, fs });

	let resolveRestart: (value: Error | null) => void;
	let restartComplete = new Promise<Error | null>((resolve) => {
		resolveRestart = resolve;
	});

	let restart: Restart = {
		container: initialContainer,
		restarted() {
			return restartComplete;
		},
	};

	async function handleServerRestart(logMsg: string) {
		info(logging, 'astro', logMsg + '\n');
		const container = restart.container;
		const result = await restartContainer(container);
		if (result instanceof Error) {
			// Failed to restart, use existing container
			resolveRestart(result);
		} else {
			// Restart success. Add new watches because this is a new container with a new Vite server
			restart.container = result;
			addWatches();
			resolveRestart(null);
		}
		restartComplete = new Promise<Error | null>((resolve) => {
			resolveRestart = resolve;
		});
	}

	function handleChangeRestart(logMsg: string) {
		return async function (changedFile: string) {
			if (shouldRestartContainer(restart.container, changedFile)) {
				handleServerRestart(logMsg);
			}
		};
	}

	// Set up watches
	function addWatches() {
		const watcher = restart.container.viteServer.watcher;
		watcher.on('change', handleChangeRestart('Configuration updated. Restarting...'));
		watcher.on('unlink', handleChangeRestart('Configuration removed. Restarting...'));
		watcher.on('add', handleChangeRestart('Configuration added. Restarting...'));

		// Restart the Astro dev server instead of Vite's when the API is called by plugins.
		// Ignore the `forceOptimize` parameter for now.
		restart.container.viteServer.restart = () => handleServerRestart('Restarting...');
	}
	addWatches();
	return restart;
}
