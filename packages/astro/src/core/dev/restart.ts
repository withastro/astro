import * as vite from 'vite';
import type { AstroSettings } from '../../@types/astro';
import { createSettings, openConfig } from '../config/index.js';
import { createSafeError } from '../errors/index.js';
import { info } from '../logger/core.js';
import type { Container, CreateContainerParams } from './container';
import { createContainer, isStarted, startContainer } from './container.js';

async function createRestartedContainer(
	container: Container,
	settings: AstroSettings,
	needsStart: boolean
): Promise<Container> {
	const { logging, fs, resolvedRoot, configFlag, configFlagPath } = container;
	const newContainer = await createContainer({
		isRestart: true,
		logging,
		settings,
		fs,
		root: resolvedRoot,
		configFlag,
		configFlagPath,
	});

	if (needsStart) {
		await startContainer(newContainer);
	}

	return newContainer;
}

export function shouldRestartContainer(
	{ settings, configFlag, configFlagPath, restartInFlight }: Container,
	changedFile: string
): boolean {
	if (restartInFlight) return false;

	let shouldRestart = false;

	// If the config file changed, reload the config and restart the server.
	if (configFlag) {
		if (!!configFlagPath) {
			shouldRestart = vite.normalizePath(configFlagPath) === vite.normalizePath(changedFile);
		}
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

interface RestartContainerParams {
	container: Container;
	flags: any;
	logMsg: string;
	handleConfigError: (err: Error) => Promise<void> | void;
	beforeRestart?: () => void;
}

export async function restartContainer({
	container,
	flags,
	logMsg,
	handleConfigError,
	beforeRestart,
}: RestartContainerParams): Promise<{ container: Container; error: Error | null }> {
	const { logging, close, resolvedRoot, settings: existingSettings } = container;
	container.restartInFlight = true;

	if (beforeRestart) {
		beforeRestart();
	}
	const needsStart = isStarted(container);
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
		return {
			container: await createRestartedContainer(container, settings, needsStart),
			error: null,
		};
	} catch (_err) {
		const error = createSafeError(_err);
		await handleConfigError(error);
		await close();
		info(logging, 'astro', 'Continuing with previous valid configuration\n');
		return {
			container: await createRestartedContainer(container, existingSettings, needsStart),
			error,
		};
	}
}

export interface CreateContainerWithAutomaticRestart {
	flags: any;
	params: CreateContainerParams;
	handleConfigError?: (error: Error) => void | Promise<void>;
	beforeRestart?: () => void;
}

interface Restart {
	container: Container;
	restarted: () => Promise<Error | null>;
}

export async function createContainerWithAutomaticRestart({
	flags,
	handleConfigError = () => {},
	beforeRestart,
	params,
}: CreateContainerWithAutomaticRestart): Promise<Restart> {
	const initialContainer = await createContainer(params);
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
		const container = restart.container;
		const { container: newContainer, error } = await restartContainer({
			beforeRestart,
			container,
			flags,
			logMsg,
			async handleConfigError(err) {
				// Send an error message to the client if one is connected.
				await handleConfigError(err);
				container.viteServer.ws.send({
					type: 'error',
					err: {
						message: err.message,
						stack: err.stack || '',
					},
				});
			},
		});
		restart.container = newContainer;
		// Add new watches because this is a new container with a new Vite server
		addWatches();
		resolveRestart(error);
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
