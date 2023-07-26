/* eslint-disable no-console */
import * as colors from 'kleur/colors';
import fs from 'node:fs';
import type { Arguments as Flags } from 'yargs-parser';
import { ZodError } from 'zod';
import { createSettings, openConfig, resolveConfigPath } from '../core/config/index.js';
import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { error, type LogOptions } from '../core/logger/core.js';
import { formatConfigErrorMessage, formatErrorMessage } from '../core/messages.js';
import * as event from '../events/index.js';
import { eventConfigError, telemetry } from '../events/index.js';

interface LoadSettingsOptions {
	cmd: string;
	flags: Flags;
	logging: LogOptions;
}

export async function loadSettings({ cmd, flags, logging }: LoadSettingsOptions) {
	const root = flags.root;
	const { astroConfig: initialAstroConfig, userConfig: initialUserConfig } = await openConfig({
		cwd: root,
		flags,
		cmd,
	}).catch(async (e) => {
		await handleConfigError(e, { cmd, cwd: root, flags, logging });
		return {} as any;
	});

	if (!initialAstroConfig) return;
	telemetry.record(event.eventCliSession(cmd, initialUserConfig, flags));
	return createSettings(initialAstroConfig, root);
}

export async function handleConfigError(
	e: any,
	{ cmd, cwd, flags, logging }: { cmd: string; cwd?: string; flags?: Flags; logging: LogOptions }
) {
	const path = await resolveConfigPath({ cwd, flags, fs });
	error(logging, 'astro', `Unable to load ${path ? colors.bold(path) : 'your Astro config'}\n`);
	if (e instanceof ZodError) {
		console.error(formatConfigErrorMessage(e) + '\n');
		telemetry.record(eventConfigError({ cmd, err: e, isFatal: true }));
	} else if (e instanceof Error) {
		console.error(formatErrorMessage(collectErrorMetadata(e)) + '\n');
	}
}
