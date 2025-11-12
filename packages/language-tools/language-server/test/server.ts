import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LanguageServerHandle } from '@volar/test-utils';
import { startLanguageServer } from '@volar/test-utils';
import * as protocol from 'vscode-languageserver-protocol/node.js';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

let serverHandle: LanguageServerHandle | undefined;
let initializeResult: protocol.InitializeResult | undefined;

export type LanguageServer = {
	handle: LanguageServerHandle;
	initializeResult: protocol.InitializeResult;
	openFakeDocument: (content: string, languageId: string) => Promise<TextDocument>;
};

export async function getLanguageServer(): Promise<LanguageServer> {
	if (!serverHandle) {
		serverHandle = startLanguageServer(
			path.resolve('./bin/nodeServer.js'),
			fileURLToPath(new URL('./fixture', import.meta.url)),
		);

		initializeResult = await serverHandle.initialize(
			URI.file(fileURLToPath(new URL('./fixture', import.meta.url))).toString(),
			{
				typescript: {
					tsdk: path.join(
						path.dirname(fileURLToPath(import.meta.url)),
						'../',
						'node_modules',
						'typescript',
						'lib',
					),
				},
				contentIntellisense: true,
			},
			{
				textDocument: {
					definition: {
						linkSupport: true,
					},
				},
				workspace: {
					// Needed for tests that use didChangeWatchedFiles
					didChangeWatchedFiles: {},
					configuration: true,
				},
			},
		);
		// Ensure that our first test does not suffer from a TypeScript overhead
		await serverHandle.sendCompletionRequest(
			'file://doesnt-exists',
			protocol.Position.create(0, 0),
		);
	}

	if (!initializeResult || !serverHandle) {
		throw new Error('Server not initialized');
	}

	return {
		handle: serverHandle,
		initializeResult: initializeResult,
		openFakeDocument: async (content: string, languageId: string) => {
			const hash = createHash('sha256').update(content).digest('base64url');
			const uri = URI.file(`does-not-exists-${hash}-.astro`).toString();
			const textDocument = await serverHandle!.openInMemoryDocument(uri, languageId, content);

			return textDocument;
		},
	};
}
