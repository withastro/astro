import { spawn } from 'node:child_process';
import {
	createReadStream,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	statSync,
	watch,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveRoot } from '../core/config/config.js';
import {
	GRACEFUL_SHUTDOWN_TIMEOUT,
	checkExistingServer,
	getLogFileURL,
	isProcessAlive,
	readLockFile,
	removeLockFile,
	type LockFileData,
	type ServerCommand,
} from '../core/dev/lockfile.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { Flags } from './flags.js';

export interface BackgroundCommandConfig {
	command: ServerCommand;
	displayName: string;
	envVar: 'ASTRO_DEV_BACKGROUND' | 'ASTRO_PREVIEW_BACKGROUND';
}

export const devServerCommand: BackgroundCommandConfig = {
	command: 'dev',
	displayName: 'Dev server',
	envVar: 'ASTRO_DEV_BACKGROUND',
};

export const previewServerCommand: BackgroundCommandConfig = {
	command: 'preview',
	displayName: 'Preview server',
	envVar: 'ASTRO_PREVIEW_BACKGROUND',
};

export interface BackgroundResult {
	pid: number;
	url: string;
	existing?: boolean;
}

export interface BackgroundErrorResult {
	error: string;
	message: string;
}

export interface StopResult {
	stopped: boolean;
	pid?: number;
	reason?: string;
}

export interface StatusResult {
	running: boolean;
	pid?: number;
	url?: string;
	port?: number;
	background?: boolean;
	uptime?: number;
}

export function formatBackgroundOutput(result: BackgroundResult | BackgroundErrorResult): string {
	return JSON.stringify(result);
}

export function formatStopOutput(result: StopResult): string {
	return JSON.stringify(result);
}

export function formatStatusOutput(result: StatusResult): string {
	return JSON.stringify(result);
}

export function formatServerRunningMessage(
	data: LockFileData,
	config: BackgroundCommandConfig,
	{ existing = false }: { existing?: boolean } = {},
): string {
	const command = `astro ${config.command}`;
	const lines = [
		`${config.displayName} ${existing ? 'already running' : 'running'} at ${data.url} (pid ${data.pid})`,
	];
	if (data.urls && data.urls.network.length > 0) {
		lines.push('  Network:');
		for (const url of data.urls.network) {
			lines.push(`    ${url}`);
		}
	}
	lines.push(
		`  Stop:   ${command} stop`,
		`  Status: ${command} status`,
		`  Logs:   ${command} logs`,
	);
	return lines.join('\n');
}

function getRootURL(flags: Flags): URL {
	return pathToFileURL(resolveRoot(flags.root) + '/');
}

export function buildBackgroundArgs(command: ServerCommand, flags: Flags): string[] {
	const args: string[] = [command];
	if (flags.port) args.push('--port', String(flags.port));
	if (flags.host != null) {
		if (typeof flags.host === 'string') {
			args.push('--host', flags.host);
		} else {
			args.push('--host');
		}
	}
	if (flags.config) args.push('--config', String(flags.config));
	if (flags.root) args.push('--root', String(flags.root));
	if (flags.allowedHosts) args.push('--allowed-hosts', String(flags.allowedHosts));
	if (flags.json) args.push('--json');
	return args;
}

export async function stopExistingServer(
	root: URL,
	command: ServerCommand,
	pid: number,
): Promise<void> {
	try {
		process.kill(pid, 'SIGTERM');
	} catch {
		// Process may have already exited between check and kill.
	}

	const deadline = Date.now() + GRACEFUL_SHUTDOWN_TIMEOUT;
	while (Date.now() < deadline) {
		if (!isProcessAlive(pid)) break;
		await new Promise((r) => setTimeout(r, 100));
	}

	if (isProcessAlive(pid)) {
		try {
			process.kill(pid, 'SIGKILL');
		} catch {
			// Already dead.
		}
	}

	removeLockFile(root, command);
}

export async function background({
	flags,
	logger,
	config,
}: {
	flags: Flags;
	logger: AstroLogger;
	config: BackgroundCommandConfig;
}): Promise<void> {
	const root = getRootURL(flags);

	const existing = checkExistingServer(root, config.command);
	if (existing && !flags.force) {
		logger.info('SKIP_FORMAT', formatServerRunningMessage(existing, config, { existing: true }));
		return;
	}

	if (existing && flags.force) {
		await stopExistingServer(root, config.command, existing.pid);
	}

	const args = buildBackgroundArgs(config.command, flags);
	const logFileURL = getLogFileURL(root, config.command);
	const logFilePath = fileURLToPath(logFileURL);
	const dotAstroDir = fileURLToPath(new URL('.astro/', root));
	if (!existsSync(dotAstroDir)) {
		mkdirSync(dotAstroDir, { recursive: true });
	}
	const logFd = openSync(logFilePath, 'w');

	const rootPath = fileURLToPath(root);
	const astroBin = resolve(rootPath, 'node_modules', 'astro', 'bin', 'astro.mjs');

	const child = spawn(process.execPath, [astroBin, ...args], {
		detached: true,
		stdio: ['ignore', logFd, logFd],
		cwd: rootPath,
		env: { ...process.env, [config.envVar]: '1' },
	});

	child.unref();

	const childPid = child.pid;
	if (!childPid) {
		logger.error('SKIP_FORMAT', `Failed to spawn background ${config.command} server process.`);
		process.exit(1);
	}

	const timeout = 30000;
	const deadline = Date.now() + timeout;

	while (Date.now() < deadline) {
		if (!isProcessAlive(childPid)) {
			logger.error('SKIP_FORMAT', `${config.displayName} process exited before becoming ready.`);
			process.exit(1);
		}

		const lockData = readLockFile(root, config.command);
		if (lockData && lockData.pid === childPid) {
			logger.info('SKIP_FORMAT', formatServerRunningMessage(lockData, config));
			return;
		}

		await new Promise((r) => setTimeout(r, 200));
	}

	try {
		process.kill(childPid, 'SIGTERM');
	} catch {
		// Already dead.
	}
	removeLockFile(root, config.command);

	logger.error('SKIP_FORMAT', `${config.displayName} failed to start within ${timeout / 1000}s.`);
	process.exit(1);
}

export async function stop({
	flags,
	logger,
	config,
}: {
	flags: Flags;
	logger: AstroLogger;
	config: BackgroundCommandConfig;
}): Promise<void> {
	const root = getRootURL(flags);
	const existing = checkExistingServer(root, config.command);

	if (!existing) {
		logger.info('SKIP_FORMAT', `No ${config.command} server is running.`);
		return;
	}

	await stopExistingServer(root, config.command, existing.pid);
	logger.info('SKIP_FORMAT', `Stopped ${config.command} server (pid ${existing.pid}).`);
}

export async function status({
	flags,
	logger,
	config,
}: {
	flags: Flags;
	logger: AstroLogger;
	config: BackgroundCommandConfig;
}): Promise<void> {
	const root = getRootURL(flags);
	const existing = checkExistingServer(root, config.command);

	if (!existing) {
		logger.info('SKIP_FORMAT', `No ${config.command} server is running.`);
		return;
	}

	const startedAt = new Date(existing.startedAt).getTime();
	const uptime = Math.floor((Date.now() - startedAt) / 1000);

	const lines = [
		`${config.displayName} running at ${existing.url} (pid ${existing.pid}, uptime ${uptime}s${existing.background ? ', background' : ''})`,
	];
	if (existing.urls && existing.urls.network.length > 0) {
		lines.push('  Network:');
		for (const url of existing.urls.network) {
			lines.push(`    ${url}`);
		}
	}

	logger.info('SKIP_FORMAT', lines.join('\n'));
}

export async function logs({
	flags,
	logger,
	config,
}: {
	flags: Flags;
	logger: AstroLogger;
	config: BackgroundCommandConfig;
}): Promise<void> {
	const root = getRootURL(flags);
	const existing = checkExistingServer(root, config.command);

	if (!existing) {
		logger.error('SKIP_FORMAT', `No ${config.command} server is running.`);
		process.exit(1);
	}

	if (!existing.background) {
		logger.error(
			'SKIP_FORMAT',
			`The running ${config.command} server was not started with \`astro ${config.command} --background\`. View logs in the terminal where it was started.`,
		);
		process.exit(1);
	}

	const logFileURL = getLogFileURL(root, config.command);
	const logFilePath = fileURLToPath(logFileURL);
	if (!existsSync(logFilePath)) {
		logger.error('SKIP_FORMAT', 'No log file found.');
		process.exit(1);
	}

	const follow = flags.follow || flags.f;

	if (!follow) {
		const content = readFileSync(logFilePath, 'utf-8');
		process.stdout.write(content);
		return;
	}

	let offset = statSync(logFilePath).size;

	if (offset > 0) {
		const content = readFileSync(logFilePath, 'utf-8');
		process.stdout.write(content);
	}

	const watcher = watch(logFilePath, () => {
		const currentSize = statSync(logFilePath).size;
		if (currentSize > offset) {
			const stream = createReadStream(logFilePath, { start: offset, encoding: 'utf-8' });
			stream.on('data', (chunk) => process.stdout.write(chunk));
			stream.on('end', () => {
				offset = currentSize;
			});
		}
	});

	const aliveCheck = setInterval(() => {
		if (!isProcessAlive(existing.pid)) {
			const currentSize = statSync(logFilePath).size;
			if (currentSize > offset) {
				const remaining = readFileSync(logFilePath, { encoding: 'utf-8' }).slice(offset);
				process.stdout.write(remaining);
			}
			watcher.close();
			clearInterval(aliveCheck);
		}
	}, 1000);

	const cleanup = () => {
		watcher.close();
		clearInterval(aliveCheck);
		process.exit(0);
	};
	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);

	await new Promise(() => {});
}
