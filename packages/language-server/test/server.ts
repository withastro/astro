/* eslint-disable no-console */
import { createHash } from 'crypto';
import cp from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as protocol from 'vscode-languageserver-protocol/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

export interface LanguageServer {
	process: cp.ChildProcess;
	connection: protocol.ProtocolConnection;
	initResult: protocol.InitializeResult;
	helpers: {
		/**
		 * Open a real file path (relative to `./fixture`) and return the associated TextDocument
		 */
		openRealDocument: (filePath: string, languageId?: string) => Promise<TextDocument>;
		/**
		 * Create a fake document from content and return the associated TextDocument
		 */
		openFakeDocument: (content: string, languageId?: string) => Promise<TextDocument>;
		requestCompletion: (
			document: TextDocument,
			position: protocol.Position
		) => Promise<protocol.CompletionList>;
		requestDiagnostics: (document: TextDocument) => Promise<protocol.FullDocumentDiagnosticReport>;
		requestHover: (document: TextDocument, position: protocol.Position) => Promise<protocol.Hover>;
		requestFormatting(
			document: TextDocument,
			options?: protocol.FormattingOptions
		): Promise<protocol.TextEdit[]>;
	};
}

let languageServer: LanguageServer | undefined;

export async function getLanguageServer() {
	if (!languageServer) {
		await initLanguageServer();
	}
	return languageServer!;
}

async function initLanguageServer() {
	if (languageServer) return;

	const dir = fileURLToPath(new URL('./fixture', import.meta.url));
	const serverModule = path.resolve('./bin/nodeServer.js');
	const childProcess = cp.fork(
		serverModule,
		['--node-ipc', `--clientProcessId=${process.pid.toString()}`],
		{
			execArgv: ['--nolazy'],
			env: process.env,
			cwd: dir,
		}
	);
	const connection = protocol.createProtocolConnection(
		new protocol.IPCMessageReader(childProcess),
		new protocol.IPCMessageWriter(childProcess)
	);
	connection.listen();

	connection.onClose((e) => console.log(e));
	connection.onDispose((e) => console.log(e));
	connection.onUnhandledNotification((e) => console.log(e));
	connection.onError((e) => console.log(e));

	const initRequest = await connection.sendRequest<protocol.InitializeResult>('initialize', {
		rootPath: './fixture',
		capabilities: {},
		initializationOptions: {
			diagnosticModel: 2, // DiagnosticModel.Pull
			typescript: {
				tsdk: path.join(
					path.dirname(fileURLToPath(import.meta.url)),
					'../',
					'node_modules',
					'typescript',
					'lib'
				),
			},
		},
	});
	await connection.sendNotification('initialized');

	languageServer = {
		process: childProcess,
		connection: connection,
		get initResult() {
			return initRequest;
		},
		helpers: {
			async openRealDocument(filePath, languageId = 'astro') {
				const fileName = path.resolve(dir, filePath);
				const uri = URI.file(fileName).toString();
				const item = protocol.TextDocumentItem.create(
					uri,
					languageId,
					0,
					fs.readFileSync(fileName, 'utf-8')
				);
				await connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, {
					textDocument: item,
				});
				return TextDocument.create(uri, languageId, 0, item.text);
			},
			async openFakeDocument(content, languageId = 'astro') {
				const hash = createHash('sha256').update(content).digest('base64url');
				const uri = URI.file(`does-not-exists-${hash}-.astro`).toString();
				const item = protocol.TextDocumentItem.create(uri, languageId, 0, content);
				await connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, {
					textDocument: item,
				});
				return TextDocument.create(uri, languageId, 0, item.text);
			},
			async requestCompletion(document, position) {
				return await connection.sendRequest<protocol.CompletionList>(
					protocol.CompletionRequest.method,
					{
						textDocument: {
							uri: document.uri,
						},
						position: position,
					}
				);
			},
			async requestDiagnostics(document) {
				return await connection.sendRequest<protocol.FullDocumentDiagnosticReport>(
					protocol.DocumentDiagnosticRequest.method,
					{
						textDocument: {
							uri: document.uri,
						},
					}
				);
			},
			async requestHover(document, position) {
				return await connection.sendRequest<protocol.Hover>(protocol.HoverRequest.method, {
					textDocument: {
						uri: document.uri,
					},
					position: position,
				});
			},
			async requestFormatting(document, options) {
				return await connection.sendRequest<protocol.TextEdit[]>(
					protocol.DocumentFormattingRequest.method,
					{
						textDocument: {
							uri: document.uri,
						},
						options: options,
					}
				);
			},
		},
	};

	// Ensure that our first test does not suffer from a TypeScript overhead
	await languageServer.helpers.requestCompletion(
		TextDocument.create('file://doesnt-exists', 'astro', 0, ''),
		protocol.Position.create(0, 0)
	);
}
