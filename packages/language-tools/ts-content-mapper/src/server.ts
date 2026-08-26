import { ErrorCodes, ResponseError, createMessageConnection } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import type { InitializeParams, InitializeResult } from './protocol.js';
import { transform } from './transform.js';

const POSITION_ENCODING = 'utf-16';

/** stdout carries the JSON-RPC stream, so stray writes there corrupt the protocol. */
function redirectConsoleToStderr() {
	const write = (...args: unknown[]) => {
		process.stderr.write(`${args.map((arg) => String(arg)).join(' ')}\n`);
	};

	console.log = write;
	console.info = write;
	console.warn = write;
	console.error = write;
	console.debug = write;
}

function initialize(params: InitializeParams): InitializeResult {
	if (!params.positionEncodings.includes(POSITION_ENCODING)) {
		throw new ResponseError(
			ErrorCodes.InvalidParams,
			`The Astro content mapper requires the ${POSITION_ENCODING} position encoding.`,
		);
	}

	return { positionEncoding: POSITION_ENCODING, diagnosticSource: 'astro' };
}

export function startServer() {
	redirectConsoleToStderr();

	const connection = createMessageConnection(
		new StreamMessageReader(process.stdin),
		new StreamMessageWriter(process.stdout),
	);

	connection.onRequest('initialize', initialize);
	connection.onRequest('openProject', () => ({}));
	connection.onRequest('closeProject', () => undefined);
	connection.onRequest('transform', transform);

	connection.listen();
}

startServer();
