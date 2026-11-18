import { ErrorCodes, ResponseError, createMessageConnection } from 'vscode-jsonrpc';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import type { InitializeParams, InitializeResult } from './protocol.js';
import { transform } from './transform.js';

const POSITION_ENCODING = 'utf-16';

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
