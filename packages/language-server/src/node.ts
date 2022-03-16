import * as vscode from 'vscode-languageserver/node';
import { startLanguageServer } from './server';

const connection = vscode.createConnection(vscode.ProposedFeatures.all);

startLanguageServer(connection);
