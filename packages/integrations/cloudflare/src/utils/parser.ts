/**
 * This file is a derivative work of wrangler by Cloudflare
 * An upstream request for exposing this API was made here:
 * https://github.com/cloudflare/workers-sdk/issues/3897
 *
 * Until further notice, we will be using this file as a workaround
 * TODO: Tackle this file, once their is an decision on the upstream request
 */

import TOML from '@iarna/toml';
import dotenv from 'dotenv';
import { findUpSync } from 'find-up';
import * as fs from 'node:fs';
import { dirname, resolve } from 'node:path';

function findWranglerToml(
	referencePath: string = process.cwd(),
	preferJson = false
): string | undefined {
	if (preferJson) {
		return (
			findUpSync(`wrangler.json`, { cwd: referencePath }) ??
			findUpSync(`wrangler.toml`, { cwd: referencePath })
		);
	}
	return findUpSync(`wrangler.toml`, { cwd: referencePath });
}
type File = {
	file?: string;
	fileText?: string;
};
type Location = File & {
	line: number;
	column: number;
	length?: number;
	lineText?: string;
	suggestion?: string;
};
type Message = {
	text: string;
	location?: Location;
	notes?: Message[];
	kind?: 'warning' | 'error';
};
class ParseError extends Error implements Message {
	readonly text: string;
	readonly notes: Message[];
	readonly location?: Location;
	readonly kind: 'warning' | 'error';

	constructor({ text, notes, location, kind }: Message) {
		super(text);
		this.name = this.constructor.name;
		this.text = text;
		this.notes = notes ?? [];
		this.location = location;
		this.kind = kind ?? 'error';
	}
}
const TOML_ERROR_NAME = 'TomlError';
const TOML_ERROR_SUFFIX = ' at row ';
type TomlError = Error & {
	line: number;
	col: number;
};
function parseTOML(input: string, file?: string): TOML.JsonMap | never {
	try {
		// Normalize CRLF to LF to avoid hitting https://github.com/iarna/iarna-toml/issues/33.
		const normalizedInput = input.replace(/\r\n/g, '\n');
		return TOML.parse(normalizedInput);
	} catch (err) {
		const { name, message, line, col } = err as TomlError;
		if (name !== TOML_ERROR_NAME) {
			throw err;
		}
		const text = message.substring(0, message.lastIndexOf(TOML_ERROR_SUFFIX));
		const lineText = input.split('\n')[line];
		const location = {
			lineText,
			line: line + 1,
			column: col - 1,
			file,
			fileText: input,
		};
		throw new ParseError({ text, location });
	}
}

export interface DotEnv {
	path: string;
	parsed: dotenv.DotenvParseOutput;
}
function tryLoadDotEnv(path: string): DotEnv | undefined {
	try {
		const parsed = dotenv.parse(fs.readFileSync(path));
		return { path, parsed };
	} catch (e) {
		// logger.debug(`Failed to load .env file "${path}":`, e);
	}
}
/**
 * Loads a dotenv file from <path>, preferring to read <path>.<environment> if
 * <environment> is defined and that file exists.
 */

export function loadDotEnv(path: string): DotEnv | undefined {
	return tryLoadDotEnv(path);
}
function getVarsForDev(config: any, configPath: string | undefined): any {
	const configDir = resolve(dirname(configPath ?? '.'));
	const devVarsPath = resolve(configDir, '.dev.vars');
	const loaded = loadDotEnv(devVarsPath);
	if (loaded !== undefined) {
		return {
			...config.vars,
			...loaded.parsed,
		};
	} else {
		return config.vars;
	}
}
export async function getEnvVars() {
	let rawConfig;
	const configPath = findWranglerToml(process.cwd(), false); // false = args.experimentalJsonConfig
	if (!configPath) {
		throw new Error('Could not find wrangler.toml');
	}
	// Load the configuration from disk if available
	if (configPath?.endsWith('toml')) {
		rawConfig = parseTOML(fs.readFileSync(configPath).toString(), configPath);
	}
	const vars = getVarsForDev(rawConfig, configPath);
	return vars;
}
