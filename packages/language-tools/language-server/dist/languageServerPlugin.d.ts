import {
	type Connection,
	type InitializeParams,
	type LanguagePlugin,
} from '@volar/language-server/node';
import { URI } from 'vscode-uri';
import { type CollectionConfig } from './core/frontmatterHolders.js';
export declare function getLanguagePlugins(
	collectionConfig: CollectionConfig,
): LanguagePlugin<URI, import('@volar/language-core').VirtualCode>[];
export declare function getLanguageServicePlugins(
	connection: Connection,
	ts: typeof import('typescript'),
	collectionConfig: CollectionConfig,
	initializeParams?: InitializeParams,
): import('@volar/language-service').LanguageServicePlugin<any>[];
