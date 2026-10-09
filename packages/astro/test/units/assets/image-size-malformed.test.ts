import * as assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

// Must stay a file:// URL: a bare Windows path is rejected by dynamic import as an unknown scheme.
const lookupUrl = new URL('../../../dist/assets/utils/vendor/image-size/lookup.js', import.meta.url)
	.href;

const PROBE_TIMEOUT = 10_000;

function writeAscii(buffer: Uint8Array, offset: number, text: string) {
	for (let i = 0; i < text.length; i++) {
		buffer[offset + i] = text.charCodeAt(i);
	}
}

// A missing guard shows up as a hang, so probe in a child process we can actually kill.
function probe(payload: Uint8Array) {
	const source = `
		const { lookup } = await import(${JSON.stringify(lookupUrl)});
		const input = new Uint8Array(Buffer.from(process.argv[1], 'base64'));
		try { lookup(input); } catch {}
	`;
	return spawnSync(
		process.execPath,
		['--input-type=module', '-e', source, Buffer.from(payload).toString('base64')],
		{ timeout: PROBE_TIMEOUT, encoding: 'utf8' },
	);
}

function assertTerminates(payload: Uint8Array) {
	const result = probe(payload);
	assert.equal(
		result.signal,
		null,
		`probe was killed after ${PROBE_TIMEOUT}ms instead of returning`,
	);
	assert.equal(result.status, 0, `probe exited unexpectedly: ${result.stderr}`);
}

describe('image-size malformed input', () => {
	it('terminates on an ICNS entry declaring zero length', () => {
		const payload = new Uint8Array(24);
		const view = new DataView(payload.buffer);
		writeAscii(payload, 0, 'icns');
		view.setUint32(4, payload.length, false);
		writeAscii(payload, 8, 'ic09');
		view.setUint32(12, 0, false);

		assertTerminates(payload);
	});

	it('terminates on a JXL container with a zero-size jxlp box', () => {
		const payload = new Uint8Array(44);
		const view = new DataView(payload.buffer);

		view.setUint32(0, 12, false);
		writeAscii(payload, 4, 'JXL ');
		payload.set([0x0d, 0x0a, 0x87, 0x0a], 8);

		view.setUint32(12, 20, false);
		writeAscii(payload, 16, 'ftyp');
		writeAscii(payload, 20, 'jxl ');
		view.setUint32(24, 0, false);
		writeAscii(payload, 28, 'jxl ');

		view.setUint32(32, 0, false);
		writeAscii(payload, 36, 'jxlp');

		assertTerminates(payload);
	});

	it('terminates on a HEIF ipco containing a zero-size ispe box', () => {
		// Oversized so the ispe dimension reads stay in bounds; a short buffer throws before the loop spins.
		const payload = new Uint8Array(100);
		const view = new DataView(payload.buffer);

		view.setUint32(0, 20, false);
		writeAscii(payload, 4, 'ftyp');
		writeAscii(payload, 8, 'avif');
		view.setUint32(12, 0, false);
		writeAscii(payload, 16, 'avif');

		view.setUint32(20, 80, false);
		writeAscii(payload, 24, 'meta');
		view.setUint32(28, 0, false);

		view.setUint32(32, 68, false);
		writeAscii(payload, 36, 'iprp');

		view.setUint32(40, 60, false);
		writeAscii(payload, 44, 'ipco');

		view.setUint32(48, 0, false);
		writeAscii(payload, 52, 'ispe');

		assertTerminates(payload);
	});
});
