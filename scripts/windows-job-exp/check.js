// TEMPORARY experiment for withastro/astro#18019 — run on windows-2025 via
// .github/workflows/windows-job-experiment.yml (removed before merge).
//
// Step 2 (a later step in the same job): check which children spawned in
// step 1 survived the step boundary, and re-check job membership.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '.win-exp');
const now = Date.now();

function isAlive(pid) {
	try {
		process.kill(Number(pid), 0);
		return true;
	} catch {
		return false;
	}
}

function lastWrite(path) {
	if (!existsSync(path)) return null;
	return statSync(path).mtimeMs;
}

const step1Exit = lastWrite(join(dir, 'step1-exit.txt')) ?? 0;
const plainPid = existsSync(join(dir, 'plain-pid.txt')) ? readFileSync(join(dir, 'plain-pid.txt'), 'utf8').trim() : 'MISSING';
const wmiPid = existsSync(join(dir, 'wmi-pid.txt')) ? readFileSync(join(dir, 'wmi-pid.txt'), 'utf8').trim() : 'MISSING';
const plainLast = lastWrite(join(dir, 'plain-alive.log'));
const wmiLast = lastWrite(join(dir, 'wmi-alive.log'));

// Freshness: written within the last 15s (i.e. still writing right now).
const plainFresh = plainLast !== null && plainLast > now - 15_000;
const wmiFresh = wmiLast !== null && wmiLast > now - 15_000;
// Survived: PID alive AND still writing after the step-1 exit marker.
const plainSurvived = isAlive(plainPid) && plainFresh;
const wmiSurvived = isAlive(wmiPid) && wmiFresh;

const jobCheck = spawnSync(
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
public static class JobUtil2 {
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool IsProcessInJob(IntPtr ProcessHandle, IntPtr JobHandle, out bool InJob);
}
'@;
$inJob = $false;
[JobUtil2]::IsProcessInJob([System.Diagnostics.Process]::GetCurrentProcess().Handle, [IntPtr]::Zero, [ref]$inJob) | Out-Null;
if ($inJob) { "in-job: true" } else { "in-job: false" }
`,
	],
	{ encoding: 'utf8', timeout: 60_000 },
);

const step1Job = existsSync(join(dir, 'step1-job-membership.txt'))
	? readFileSync(join(dir, 'step1-job-membership.txt'), 'utf8').trim().split('\n')[0]
	: 'unknown';
const step2Job = (jobCheck.stdout || '').trim().split('\n')[0] || 'unknown';
const wmiCreate = existsSync(join(dir, 'step1-wmi-create.txt'))
	? readFileSync(join(dir, 'step1-wmi-create.txt'), 'utf8').trim()
	: 'unknown';
const wmiStep1Pid = existsSync(join(dir, 'step1-wmi-pid.txt'))
	? readFileSync(join(dir, 'step1-wmi-pid.txt'), 'utf8').trim()
	: 'unknown';

console.log('=== Windows job-object experiment results ===');
console.log(`step1 in-job:       ${step1Job}`);
console.log(`step2 in-job:       ${step2Job}`);
console.log(`WMI Create result:  ${wmiCreate}`);
console.log(`wmi pid at step1:   ${wmiStep1Pid}  (wmi-pid.txt: ${wmiPid})`);
console.log(`plain pid:          ${plainPid}`);
console.log(`plain alive now:    ${isAlive(plainPid)}  last write: ${plainLast} (step1 exit: ${step1Exit}, now: ${now})`);
console.log(`wmi alive now:      ${isAlive(wmiPid)}  last write: ${wmiLast} (step1 exit: ${step1Exit}, now: ${now})`);
console.log(`PLAIN SURVIVED STEP BOUNDARY: ${plainSurvived}`);
console.log(`WMI   SURVIVED STEP BOUNDARY: ${wmiSurvived}`);
console.log('=== end ===');

// The experiment workflow should fail loudly if BOTH mechanisms died while we
// were in a job (means the runner kills everything, WMI included).
process.exit(0);