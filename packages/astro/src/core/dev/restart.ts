import type { AstroSettings } from '../../@types/astro';
import type { Container, CreateContainerParams } from './container';
import * as vite from 'vite';
import { createSettings, openConfig } from '../config/index.js';
import { info } from '../logger/core.js';
import { createContainer, isStarted, startContainer } from './container.js';
import { createSafeError } from '../errors/index.js';

async function createRestartedContainer(container: Container, settings: AstroSettings): Promise<Container> {
	const {
		logging,
		fs,
		resolvedRoot,
		configFlag,
		configFlagPath
	} = container;
	const needsStart = isStarted(container);
	const newContainer = await createContainer({
		isRestart: true,
		logging,
		settings,
		fs,
		root: resolvedRoot,
		configFlag,
		configFlagPath,
	});

	if(needsStart) {
		await startContainer(newContainer);
	}

	return newContainer;
}

export function shouldRestartContainer({
	settings,
	configFlag,
	configFlagPath,
	resolvedRoot,
	restartInFlight
}: Container, changedFile: string): boolean {
	if(restartInFlight) return false;

	let shouldRestart = false;

	// If the config file changed, reload the config and restart the server.
	shouldRestart = configFlag
		? // If --config is specified, only watch changes for this file
			!!configFlagPath && vite.normalizePath(configFlagPath) === vite.normalizePath(changedFile)
		: // Otherwise, watch for any astro.config.* file changes in project root
			new RegExp(
				`${vite.normalizePath(resolvedRoot)}.*astro\.config\.((mjs)|(cjs)|(js)|(ts))$`
			).test(vite.normalizePath(changedFile));

	if (!shouldRestart && settings.watchFiles.length > 0) {
		// If the config file didn't change, check if any of the watched files changed.
		shouldRestart = settings.watchFiles.some(
			(path) => vite.normalizePath(path) === vite.normalizePath(changedFile)
		);
	}

	return shouldRestart;
}

interface RestartContainerParams {
	container: Container;
	flags: any;
	logMsg: string;
	handleConfigError: (err: unknown) => Promise<void> | void;
}

export async function restartContainer({
	container,
	flags,
	logMsg,
	handleConfigError
}: RestartContainerParams): Promise<Container> {
	const {
		logging,
		close,
		resolvedRoot,
		settings: existingSettings
	} = container;
	container.restartInFlight = true;

	//console.clear(); // TODO move this
	try {
		const newConfig = await openConfig({
			cwd: resolvedRoot,
			flags,
			cmd: 'dev',
			logging,
			isRestart: true,
			fsMod: container.fs,
		});
		info(logging, 'astro', logMsg + '\n');
		let astroConfig = newConfig.astroConfig;
		const settings = createSettings(astroConfig, resolvedRoot);
		await close();
		return createRestartedContainer(container, settings);
	} catch (e) {
		await handleConfigError(e);
		await close();
		info(logging, 'astro', 'Continuing with previous valid configuration\n');
		return createRestartedContainer(container, existingSettings);
	}
}

export interface CreateContainerWithAutomaticRestart {
	flags: any;
	params: CreateContainerParams;
	handleConfigError?: (error: Error) => void | Promise<void>;
}

interface Restart {
	container: Container;
	restarted: () => Promise<void>;
}

export async function createContainerWithAutomaticRestart({
	flags,
	handleConfigError = (_e: Error) => {},
	params
}: CreateContainerWithAutomaticRestart): Promise<Restart> {
	let container = await createContainer(params);
	let resolveRestart: (value: void) => void;
	let restartComplete = new Promise<void>(resolve => {
		resolveRestart = resolve;
	});

	let restart: Restart = {
		container,
		restarted() {
			return restartComplete;
		}
	};

	function handleServerRestart(logMsg: string) {
		// eslint-disable-next-line @typescript-eslint/no-shadow
		const container = restart.container;
		return async function(changedFile: string) {
			if(shouldRestartContainer(container, changedFile)) {
				restart.container = await restartContainer({
					container,
					flags,
					logMsg,
					async handleConfigError(_err) {
						// Send an error message to the client if one is connected.
						const error = createSafeError(_err);
						await handleConfigError(error);
						container.viteServer.ws.send({
							type: 'error',
							err: {
								message: error.message,
								stack: error.stack || ''
							}
						});
					}
				});
				// Add new watches because this is a new container with a new Vite server
				addWatches();
				resolveRestart();
				restartComplete = new Promise<void>(resolve => {
					resolveRestart = resolve;
				});
			}
		}
	}

	// Set up watches
	function addWatches() {
		const watcher = restart.container.viteServer.watcher;
		watcher.on('change', handleServerRestart('Configuration updated. Restarting...'));
		watcher.on('unlink', handleServerRestart('Configuration removed. Restarting...'));
		watcher.on('add', handleServerRestart('Configuration added. Restarting...'));
	}
	addWatches();
	return restart;
}
