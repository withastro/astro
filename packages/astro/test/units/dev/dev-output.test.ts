import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatStopOutput } from '../../../dist/cli/dev/stop.js';
import { formatStatusOutput } from '../../../dist/cli/dev/status.js';
import {
	formatBackgroundOutput,
	formatServerRunningMessage,
} from '../../../dist/cli/dev/background.js';

// #region formatStopOutput
describe('formatStopOutput', () => {
	it('formats a successful stop', () => {
		const result = JSON.parse(formatStopOutput({ stopped: true, pid: 12345 }));
		assert.equal(result.stopped, true);
		assert.equal(result.pid, 12345);
	});

	it('formats a not-running stop', () => {
		const result = JSON.parse(formatStopOutput({ stopped: false, reason: 'not_running' }));
		assert.equal(result.stopped, false);
		assert.equal(result.reason, 'not_running');
	});

	it('produces valid JSON', () => {
		const output = formatStopOutput({ stopped: true, pid: 1 });
		assert.doesNotThrow(() => JSON.parse(output));
	});
});
// #endregion

// #region formatStatusOutput
describe('formatStatusOutput', () => {
	it('formats a running server', () => {
		const result = JSON.parse(
			formatStatusOutput({
				running: true,
				pid: 12345,
				url: 'http://localhost:4321',
				port: 4321,
				background: false,
				uptime: 3600,
			}),
		);
		assert.equal(result.running, true);
		assert.equal(result.pid, 12345);
		assert.equal(result.url, 'http://localhost:4321');
		assert.equal(result.port, 4321);
		assert.equal(result.uptime, 3600);
	});

	it('formats a not-running server', () => {
		const result = JSON.parse(formatStatusOutput({ running: false }));
		assert.equal(result.running, false);
		assert.equal(result.pid, undefined);
	});

	it('produces valid JSON', () => {
		const output = formatStatusOutput({ running: false });
		assert.doesNotThrow(() => JSON.parse(output));
	});
});
// #endregion

// #region formatBackgroundOutput
describe('formatBackgroundOutput', () => {
	it('formats a successful background start', () => {
		const result = JSON.parse(
			formatBackgroundOutput({
				pid: 12345,
				url: 'http://localhost:4321',
			}),
		);
		assert.equal(result.pid, 12345);
		assert.equal(result.url, 'http://localhost:4321');
	});

	it('formats an existing server response', () => {
		const result = JSON.parse(
			formatBackgroundOutput({
				pid: 12345,
				url: 'http://localhost:4321',
				existing: true,
			}),
		);
		assert.equal(result.existing, true);
	});

	it('formats an error response', () => {
		const result = JSON.parse(
			formatBackgroundOutput({
				error: 'timeout',
				message: 'Dev server failed to start within 30s.',
			}),
		);
		assert.equal(result.error, 'timeout');
		assert.equal(result.message, 'Dev server failed to start within 30s.');
	});

	it('produces valid JSON', () => {
		const output = formatBackgroundOutput({ pid: 1, url: 'http://localhost:4321' });
		assert.doesNotThrow(() => JSON.parse(output));
	});
});
// #endregion

// #region formatServerRunningMessage
describe('formatServerRunningMessage', () => {
	const base = {
		pid: 54576,
		port: 4321,
		url: 'http://localhost:4321',
		background: true,
		startedAt: '2026-05-05T10:00:00.000Z',
	};

	it('omits the Network section when there are no network urls', () => {
		const output = formatServerRunningMessage(base);
		assert.equal(
			output,
			'Dev server running at http://localhost:4321 (pid 54576)\n' +
				'  Stop:   astro dev stop\n' +
				'  Status: astro dev status\n' +
				'  Logs:   astro dev logs',
		);
	});

	it('omits the Network section when network is an empty array', () => {
		const output = formatServerRunningMessage({
			...base,
			urls: { local: ['http://localhost:4321/'], network: [] },
		});
		assert.ok(!output.includes('Network'));
	});

	it('lists every network address when --host exposed them', () => {
		const output = formatServerRunningMessage({
			...base,
			urls: {
				local: ['http://localhost:4321/'],
				network: ['http://192.168.1.30:4321/', 'http://100.96.45.51:4321/'],
			},
		});
		assert.equal(
			output,
			'Dev server running at http://localhost:4321 (pid 54576)\n' +
				'  Network:\n' +
				'    http://192.168.1.30:4321/\n' +
				'    http://100.96.45.51:4321/\n' +
				'  Stop:   astro dev stop\n' +
				'  Status: astro dev status\n' +
				'  Logs:   astro dev logs',
		);
	});

	it('uses "already running" wording for an existing server', () => {
		const output = formatServerRunningMessage(base, { existing: true });
		assert.ok(output.startsWith('Dev server already running at http://localhost:4321 (pid 54576)'));
	});
});
// #endregion
