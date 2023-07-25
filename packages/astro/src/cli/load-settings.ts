/* eslint-disable no-console */
import * as colors from 'kleur/colors';
import fs from 'node:fs';
import type { Arguments as Flags } from 'yargs-parser';
import { ZodError } from 'zod';
import type { AstroInlineConfig } from '../@types/astro.js';
import {
	createSettings,
	resolveConfig,
	resolveConfigPath,
	resolveRoot,
} from '../core/config/index.js';
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
	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { astroConfig: initialAstroConfig, userConfig: initialUserConfig } = await resolveConfig(
		inlineConfig,
		cmd
	).catch(async (e) => {
		await handleConfigError(e, { cmd, cwd: inlineConfig.root, flags, logging });
		return {} as any;
	});

	const mode = cmd === 'build' ? 'build' : 'dev';
	if (!initialAstroConfig) return;
	telemetry.record(event.eventCliSession(cmd, initialUserConfig, flags));
	return createSettings(initialAstroConfig, mode, inlineConfig.root);
}

export async function handleConfigError(
	e: any,
	{ cmd, cwd, flags, logging }: { cmd: string; cwd?: string; flags?: Flags; logging: LogOptions }
) {
	const root = resolveRoot(cwd);
	const path = await resolveConfigPath({ root, configFile: flags?.config, fs });
	error(logging, 'astro', `Unable to load ${path ? colors.bold(path) : 'your Astro config'}\n`);
	if (e instanceof ZodError) {
		console.error(formatConfigErrorMessage(e) + '\n');
		telemetry.record(eventConfigError({ cmd, err: e, isFatal: true }));
	} else if (e instanceof Error) {
		console.error(formatErrorMessage(collectErrorMetadata(e)) + '\n');
	}
}

export function flagsToAstroInlineConfig(flags: Flags): AstroInlineConfig {
	return {
		configFile: typeof flags.config === 'string' ? flags.config : undefined,
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		base: typeof flags.base === 'string' ? flags.base : undefined,
		markdown: {
			drafts: typeof flags.drafts === 'boolean' ? flags.drafts : undefined,
		},
		server: {
			port: typeof flags.port === 'number' ? flags.port : undefined,
			host:
				typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
			open: typeof flags.open === 'boolean' ? flags.open : undefined,
		},
		experimental: {
			assets: typeof flags.experimentalAssets === 'boolean' ? flags.experimentalAssets : undefined,
		},
	};
}
