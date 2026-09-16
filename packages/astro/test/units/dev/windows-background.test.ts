import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { isProcessAlive } from '../../../dist/core/dev/lockfile.js';
import {
	buildWindowsSpawnCommandLine,
	quoteWindowsCommandLineArg,
	spawnWindowsBackgroundChild,
} from '../../../dist/cli/windows-background.js';

// #region quoteWindowsCommandLineArg
describe('quoteWindowsCommandLineArg', () => {
	it('leaves arguments without spaces or quotes untouched', () => {
		assert.equal(quoteWindowsCommandLineArg('node.exe'), 'node.exe');
		assert.equal(
			quoteWindowsCommandLineArg('C:\\astro\\bin\\astro.mjs'),
			'C:\\astro\\bin\\astro.mjs',
		);
	});

	it('wraps arguments with spaces in double quotes', () => {
		assert.equal(
			quoteWindowsCommandLineArg('C:\\Program Files\\nodejs\\node.exe'),
			'"C:\\Program Files\\nodejs\\node.exe"',
		);
	});

	it('escapes embedded double quotes with backslashes', () => {
		assert.equal(quoteWindowsCommandLineArg('a"b'), '"a\\"b"');
	});

	it('doubles trailing backslashes before the closing quote', () => {
		assert.equal(quoteWindowsCommandLineArg('C:\\dir with space\\'), '"C:\\dir with space\\\\"');
	});
});
// #endregion

// #region buildWindowsSpawnCommandLine
describe('buildWindowsSpawnCommandLine', () => {
	it('joins the three arguments, quoting the ones that need it', () => {
		const cmd = buildWindowsSpawnCommandLine(
			'C:\\Program Files\\nodejs\\node.exe',
			'C:\\Users\\me\\AppData\\Local\\Temp\\astro bg-launcher.mjs',
			'C:\\Users\\me\\AppData\\Local\\Temp\\astro-bg-config.json',
		);
		assert.equal(
			cmd,
			'"C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\me\\AppData\\Local\\Temp\\astro bg-launcher.mjs" C:\\Users\\me\\AppData\\Local\\Temp\\astro-bg-config.json',
		);
	});
});
// #endregion

// Ask Windows whether a process is a member of any Job Object. Returns the
// probe result for the given PID, or 'open-failed' when the process handle
// cannot be opened (e.g. the process already exited).
function processInJob(pid: number): 'in-job' | 'not-in-job' | 'open-failed' {
	const ps = spawnSync(
		'powershell.exe',
		[
			'-NoProfile',
			'-NonInteractive',
			'-ExecutionPolicy',
			'Bypass',
			'-Command',
			`
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class JobProbe {
	[DllImport("kernel32.dll", SetLastError=true)]
	public static extern bool IsProcessInJob(IntPtr ProcessHandle, IntPtr JobHandle, out bool InJob);
	[DllImport("kernel32.dll", SetLastError=true)]
	public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);
	[DllImport("kernel32.dll")]
	public static extern bool CloseHandle(IntPtr hObject);
}
'@;
$h = [JobProbe]::OpenProcess(0x1000, $false, ${pid});
if ($h -eq [IntPtr]::Zero) {
	"open-failed"
} else {
	$inJob = $false;
	[JobProbe]::IsProcessInJob($h, [IntPtr]::Zero, [ref]$inJob) | Out-Null;
	[JobProbe]::CloseHandle($h) | Out-Null;
	if ($inJob) { "in-job" } else { "not-in-job" }
}
`,
		],
		{ encoding: 'utf8', timeout: 60_000 },
	);
	return (ps.stdout || '').trim().split('\n')[0] as 'in-job' | 'not-in-job' | 'open-failed';
}

// #region spawnWindowsBackgroundChild (Windows only)
describe('spawnWindowsBackgroundChild (Windows)', { skip: process.platform !== 'win32' }, () => {
	afterEach(() => {
		// The escaped child lives outside the runner's Job Object, so it is
		// not cleaned up automatically; every test kills what it spawned.
	});

	it('spawns the child outside any Job Object with output going to the log file', async () => {
		// Informational: whether the test runner itself places processes in
		// a Job Object tells us if this environment exercises the escape.
		console.info(`test process in job: ${processInJob(process.pid)}`);

		const tempDir = mkdtempSync(join(tmpdir(), 'astro-win-bg-'));
		const marker = join(tempDir, 'marker.txt');
		const logFile = join(tempDir, 'child.log');
		// A stand-in for the astro CLI: a node child that keeps writing its
		// marker and announces itself on stdout.
		const script = `const fs = require('node:fs'); setInterval(() => { try { fs.appendFileSync(${JSON.stringify(marker)}, String(Date.now()) + '\\n'); } catch {} }, 200); console.log('child-started ' + process.pid);`;
		let pid: number | null = null;
		try {
			pid = await spawnWindowsBackgroundChild({
				nodePath: process.execPath,
				binPath: process.execPath,
				args: ['-e', script],
				cwd: tempDir,
				logFile,
				env: { ...process.env, ASTRO_WIN_BG_TEST: '1' },
			});
			assert.ok(pid, 'expected the escaped child to start');

			// Give the child time to boot and run its first interval.
			await new Promise((r) => setTimeout(r, 1500));

			assert.equal(isProcessAlive(pid), true, 'expected the escaped child to be alive');
			assert.equal(existsSync(marker), true, 'expected the child to have written its marker');
			const log = readFileSync(logFile, 'utf8');
			assert.ok(log.includes('child-started'), 'expected child stdout to land in the log file');

			// The point of the escape: the child must not be a member of the
			// caller's Job Object, so KILL_ON_JOB_CLOSE cannot touch it.
			const inJob = processInJob(pid);
			assert.equal(inJob, 'not-in-job', 'expected the escaped child to be outside any Job Object');
		} catch (err) {
			// Surface the escape diagnostics written to the log file.
			if (existsSync(logFile)) {
				console.info(`[diagnostic] child.log:\n${readFileSync(logFile, 'utf8')}`);
			}
			throw err;
		} finally {
			if (pid !== null) {
				try {
					process.kill(pid);
				} catch {
					// Already exited.
				}
			}
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
// #endregion
