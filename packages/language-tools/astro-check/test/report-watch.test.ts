import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

it('Emits complete JSON reports for watched changes without terminal controls', {
	timeout: 30_000,
}, async (t) => {
	const root = mkdtempSync(path.join(tmpdir(), 'astro-check-watch-'));
	writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ include: ['./*.astro'] }));
	copyFileSync(
		new URL('./fixture/fileWithNoErrors.astro', import.meta.url),
		path.join(root, 'clean.astro'),
	);
	const child = spawn(
		process.execPath,
		[
			fileURLToPath(new URL('../bin/astro-check.js', import.meta.url)),
			'--watch',
			'--reporter=json',
		],
		{ cwd: root, env: { ...process.env, NODE_OPTIONS: '', FORCE_COLOR: '1' } },
	);
	t.after(async () => {
		if (child.exitCode === null && child.signalCode === null) {
			const closed = once(child, 'close');
			child.kill();
			await closed;
		}
		rmSync(root, { recursive: true, force: true });
	});
	child.stdout.setEncoding('utf8');
	child.stderr.setEncoding('utf8');
	let output = '';
	let pending = '';
	let stderr = '';
	const reports: { summary: { errors: number }; diagnostics: { file: string }[] }[] = [];
	child.stderr.on('data', (chunk) => {
		stderr += chunk;
	});
	await new Promise<void>((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', (code) => reject(new Error(`Checker exited with ${code}: ${stderr}`)));
		child.stdout.on('data', (chunk) => {
			output += chunk;
			pending += chunk;
			try {
				let end = pending.indexOf('\n}\n');
				while (end !== -1) {
					reports.push(JSON.parse(pending.slice(0, end + 3)));
					pending = pending.slice(end + 3);
					if (reports.length === 1) {
						writeFileSync(
							path.join(root, 'clean.astro'),
							readFileSync(new URL('./fixture/fileWithErrors.astro', import.meta.url)),
						);
					} else {
						resolve();
					}
					end = pending.indexOf('\n}\n');
				}
			} catch (error) {
				reject(error);
			}
		});
	});
	assert.equal(output, stripVTControlCharacters(output));
	assert.equal(pending, '');
	assert.equal(reports[0].summary.errors, 0);
	assert.equal(reports[1].summary.errors, 1);
	assert.equal(reports[1].diagnostics[0].file, 'clean.astro');
});
