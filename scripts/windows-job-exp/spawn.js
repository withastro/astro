// TEMPORARY experiment for withastro/astro#18019 — run on windows-2025 via
// .github/workflows/windows-job-experiment.yml (removed before merge).
//
// Step 1 of the experiment: detect whether this process lives inside a Windows
// Job Object, then spawn two long-lived children and exit:
//   1. plain: node spawn({ detached: true }) — today's astro background spawn
//   2. escaped: a child created through WMI Win32_Process.Create (created by the
//      WMI provider service, which is outside the runner's job)
// A later step checks which children survived the step boundary.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '.win-exp');
mkdirSync(dir, { recursive: true });

function ps(script) {
	const r = spawnSync(
		'powershell.exe',
		['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
		{ encoding: 'utf8', timeout: 60_000 },
	);
	return { stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim(), status: r.status };
}

// --- 1. Job membership of the current process --------------------------------
const jobCheck = ps(`
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class JobUtil {
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool IsProcessInJob(IntPtr ProcessHandle, IntPtr JobHandle, out bool InJob);
}
'@;
$inJob = $false;
[JobUtil]::IsProcessInJob([System.Diagnostics.Process]::GetCurrentProcess().Handle, [IntPtr]::Zero, [ref]$inJob) | Out-Null;
if ($inJob) { "in-job: true" } else { "in-job: false" }
`);
writeFileSync(join(dir, 'step1-job-membership.txt'), jobCheck.stdout + '\n' + jobCheck.stderr);

// --- 2. Plain detached spawn (today's astro behavior) ------------------------
const plainChildScript = `
const { appendFileSync } = require('node:fs');
setInterval(() => {
  try { appendFileSync(${JSON.stringify(join(dir, 'plain-alive.log'))}, process.pid + ' ' + Date.now() + '\\n'); } catch {}
}, 500);
`;
const plain = spawn(process.execPath, ['-e', plainChildScript], {
	detached: true,
	stdio: 'ignore',
	windowsHide: true,
});
plain.unref();
writeFileSync(join(dir, 'plain-pid.txt'), String(plain.pid));

// --- 3. WMI-escaped spawn ----------------------------------------------------
const childScript = `
const { appendFileSync } = require('node:fs');
setInterval(() => {
  try { appendFileSync(${JSON.stringify(join(dir, 'wmi-alive.log'))}, process.pid + ' ' + Date.now() + '\\n'); } catch {}
}, 500);
`;
writeFileSync(join(dir, 'wmi-child.mjs'), childScript);

const launcherScript = `
import { spawn } from 'node:child_process';
import { openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const logFd = openSync(cfg.logFile, 'w');
const child = spawn(cfg.node, ['-e', cfg.script], {
  detached: true,
  windowsHide: true,
  stdio: ['ignore', logFd, logFd],
  cwd: cfg.cwd,
  env: { ...process.env, ...cfg.env },
});
writeFileSync(cfg.pidFile, String(child.pid), 'utf8');
try { unlinkSync(cfg.configFile); } catch {}
child.unref();
`;
writeFileSync(join(dir, 'wmi-launcher.mjs'), launcherScript);

const cfg = {
	node: process.execPath,
	script: childScript,
	cwd: process.cwd(),
	logFile: join(dir, 'wmi-launcher.log'),
	pidFile: join(dir, 'wmi-pid.txt'),
	configFile: join(dir, 'wmi-cfg.json'),
	env: { WIN_EXP_MARKER: 'yes' },
};
writeFileSync(join(dir, 'wmi-cfg.json'), JSON.stringify(cfg));

const commandLine = `"${process.execPath}" "${join(dir, 'wmi-launcher.mjs')}" "${join(dir, 'wmi-cfg.json')}"`;
const wmiCreate = ps(`
$cfg = Get-Content -Raw ${JSON.stringify(join(dir, 'wmi-cfg.json'))} | ConvertFrom-Json;
$startup = New-CimInstance -ClassName Win32_ProcessStartup -Property @{ ShowWindow = 0 };
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = ${JSON.stringify(commandLine)};
  CurrentDirectory = $cfg.cwd;
  ProcessStartupInformation = $startup;
};
"returnValue: $($r.ReturnValue) processId: $($r.ProcessId)";
`);
writeFileSync(join(dir, 'step1-wmi-create.txt'), wmiCreate.stdout + '\n' + wmiCreate.stderr);

// Wait for the escaped child's pid file to appear (proves the launcher ran).
const deadline = Date.now() + 15_000;
let wmiPid = null;
while (Date.now() < deadline) {
	if (existsSync(join(dir, 'wmi-pid.txt'))) {
		wmiPid = readFileSync(join(dir, 'wmi-pid.txt'), 'utf8').trim();
		break;
	}
	await new Promise((r) => setTimeout(r, 250));
}
writeFileSync(join(dir, 'step1-wmi-pid.txt'), wmiPid || 'MISSING');

// Give the children a moment to write, then exit and let the runner clean up.
writeFileSync(join(dir, 'step1-exit.txt'), String(Date.now()));
await new Promise((r) => setTimeout(r, 2500));
console.log('spawn done. plain pid:', plain.pid, 'wmi pid:', wmiPid || 'MISSING');
process.exit(0);