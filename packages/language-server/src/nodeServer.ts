import { createConnection, startLanguageServer } from '@volar/language-server/node';
import { plugin } from './languageServerPlugin.js';

startLanguageServer(createConnection(), plugin);
