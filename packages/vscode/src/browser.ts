import { ExtensionContext, Position, TextDocument, Uri } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	RequestType,
	TextDocumentPositionParams,
} from 'vscode-languageclient/browser';
import * as tsVersion from './features/typescriptVersionBrowser';
import { activateTagClosing } from './html/autoClose';
import { commonActivate, getInitOptions } from './shared';

const TagCloseRequest: RequestType<TextDocumentPositionParams, string, any> = new RequestType('html/tag');

export async function activate(context: ExtensionContext) {
	const serverMain = Uri.joinPath(context.extensionUri, 'dist/browser/server.js').with({ query: 'target=web' });
	const worker = new Worker(serverMain.toString(true));

	const clientOptions = getInitOptions('browser', {
		serverPath: undefined,
	});
	const client = createLanguageServer(clientOptions, worker);
	client
		.start()
		.then(() => {
			const tagRequestor = (document: TextDocument, position: Position) => {
				const param = client.code2ProtocolConverter.asTextDocumentPositionParams(document, position);
				return client.sendRequest(TagCloseRequest, param);
			};
			const disposable = activateTagClosing(tagRequestor, { astro: true }, 'html.autoClosingTags');
			context.subscriptions.push(disposable);
		})
		.catch((err) => {
			console.error('Astro, unable to load language server.', err);
		});

	commonActivate(context, client, tsVersion);

	return {
		getLanguageServer: () => client,
	};
}

function createLanguageServer(clientOptions: LanguageClientOptions, worker: Worker) {
	return new LanguageClient('astro', 'Astro', clientOptions, worker);
}
