import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Quote a single argument for a Windows command line following the
 * `CreateProcess` parsing rules (the same rules the C runtime's
 * `parse_cmdline` uses): arguments containing whitespace or quotes are wrapped
 * in double quotes, embedded quotes are backslash-escaped, and backslashes
 * immediately before a quote (or at the end of the argument) are doubled.
 */
export function quoteWindowsCommandLineArg(arg: string): string {
	if (!/[ \t"]/.test(arg)) {
		return arg;
	}
	let result = '"';
	for (let i = 0; i < arg.length; i++) {
		let backslashes = 0;
		while (i < arg.length && arg[i] === '\\') {
			backslashes++;
			i++;
		}
		if (i >= arg.length) {
			// Trailing backslashes must be doubled before the closing quote.
			result += '\\'.repeat(backslashes * 2);
			break;
		}
		if (arg[i] === '"') {
			result += '\\'.repeat(backslashes * 2 + 1) + '"';
		} else {
			result += '\\'.repeat(backslashes) + arg[i];
		}
	}
	return result + '"';
}

/**
 * Build the `CommandLine` string handed to `Win32_Process.Create`: the node
 * executable, the launcher script, and the config file path, each quoted.
 */
export function buildWindowsSpawnCommandLine(
	nodePath: string,
	scriptPath: string,
	configPath: string,
): string {
	return [
		quoteWindowsCommandLineArg(nodePath),
		quoteWindowsCommandLineArg(scriptPath),
		quoteWindowsCommandLineArg(configPath),
	].join(' ');
}

/**
 * The launcher script that actually starts the background server. It runs as
 * the process created by `Win32_Process.Create` (outside the caller's job), so
 * any process it spawns also lives outside the job. It restores the full caller
 * environment from the config file, redirects the server's output to the log
 * file, and reports the server's PID before exiting.
 */
const BACKGROUND_LAUNCHER_SCRIPT = `
import { spawn } from 'node:child_process';
import { openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const logFd = openSync(config.logFile, 'w');
const child = spawn(config.node, [config.bin, ...config.args], {
	detached: true,
	windowsHide: true,
	stdio: ['ignore', logFd, logFd],
	cwd: config.cwd,
	env: config.env,
});
writeFileSync(config.pidFile, String(child.pid), 'utf8');
try {
	unlinkSync(config.configFile);
} catch {}
child.unref();
`;

/**
 * PowerShell script that asks the WMI provider to create the launcher process.
 * `Win32_Process.Create` runs in the WMI service (wmiprvse), which is not a
 * member of the caller's Job Object, so the created process — and everything it
 * spawns — escapes a `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` job.
 */
const WMI_ESCAPE_SCRIPT = `
param([string]$ConfigPath)
$cfg = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$startup = New-CimInstance -ClassName Win32_ProcessStartup -Property @{ ShowWindow = 0 }
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
	CommandLine = $cfg.CommandLine
	CurrentDirectory = $cfg.CurrentDirectory
	ProcessStartupInformation = $startup
}
if ($result.ReturnValue -ne 0) {
	Write-Error "Win32_Process.Create failed with return value $($result.ReturnValue)"
	exit 1
}
`;

export interface WindowsBackgroundChildOptions {
	/** Absolute path to the node executable that runs the server. */
	nodePath: string;
	/** Absolute path to the script the server runs (e.g. astro's CLI entry). */
	binPath: string;
	/** CLI arguments passed to the server. */
	args: string[];
	/** Working directory for the server process. */
	cwd: string;
	/** Log file the server's stdout/stderr is written to. */
	logFile: string;
	/** Full environment for the server process. */
	env: Record<string, string | undefined>;
}

/**
 * Spawn a background server on Windows in a way that survives the parent CLI
 * exiting inside a runner's Job Object.
 *
 * `child_process.spawn({ detached: true })` maps to `DETACHED_PROCESS`, which
 * does not remove the child from the caller's Job Object — agent runners and CI
 * systems place the whole process tree in a job with
 * `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, so the child is terminated the moment
 * the runner closes the job (right after this parent exits). This instead asks
 * the WMI provider to create a small launcher process; the provider runs
 * outside the caller's job, so the launcher and the server it spawns outlive
 * the job.
 *
 * Returns the server's PID, or `null` when the WMI path is unavailable (e.g.
 * the WMI service is disabled); callers fall back to a plain detached spawn.
 */
export async function spawnWindowsBackgroundChild(
	options: WindowsBackgroundChildOptions,
): Promise<number | null> {
	const id = randomUUID();
	const tempDir = tmpdir();
	const launcherPath = join(tempDir, `astro-background-${id}-launcher.mjs`);
	const scriptPath = join(tempDir, `astro-background-${id}-escape.ps1`);
	const configPath = join(tempDir, `astro-background-${id}-config.json`);
	const pidPath = join(tempDir, `astro-background-${id}.pid`);

	try {
		writeFileSync(launcherPath, BACKGROUND_LAUNCHER_SCRIPT, 'utf8');
		writeFileSync(scriptPath, WMI_ESCAPE_SCRIPT, 'utf8');

		// The config is read by both the PowerShell script (CommandLine /
		// CurrentDirectory) and the launcher (server process details). It
		// carries the full caller environment, so the launcher deletes it
		// immediately after reading it.
		writeFileSync(
			configPath,
			JSON.stringify({
				node: options.nodePath,
				bin: options.binPath,
				args: options.args,
				cwd: options.cwd,
				logFile: options.logFile,
				pidFile: pidPath,
				configFile: configPath,
				env: options.env,
				commandLine: buildWindowsSpawnCommandLine(options.nodePath, launcherPath, configPath),
				currentDirectory: options.cwd,
			}),
			'utf8',
		);

		const powershell = spawn(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-ExecutionPolicy',
				'Bypass',
				'-File',
				scriptPath,
				configPath,
			],
			{ windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
		);
		const exitCode = await new Promise<number>((resolve) => {
			powershell.once('exit', (code) => resolve(code ?? -1));
			powershell.once('error', () => resolve(-1));
		});
		if (exitCode !== 0) {
			return null;
		}

		// The launcher writes the server's PID right after spawning it, before
		// the server itself has booted. Poll for it; if it never appears the
		// launcher did not run, so treat the escape as failed.
		const deadline = Date.now() + 15_000;
		while (Date.now() < deadline) {
			if (existsSync(pidPath)) {
				const pid = Number.parseInt(readFileSync(pidPath, 'utf8').trim(), 10);
				return Number.isInteger(pid) && pid > 0 ? pid : null;
			}
			await new Promise((r) => setTimeout(r, 200));
		}
		return null;
	} finally {
		for (const file of [launcherPath, scriptPath, configPath, pidPath]) {
			try {
				unlinkSync(file);
			} catch {
				// Already deleted or never created.
			}
		}
	}
}
