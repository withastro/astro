import { createConnection, startTypeScriptServer } from '@volar/language-server/node';
import { createPlugin } from './languageServerPlugin.js';

const connection = createConnection();
const plugin = createPlugin(connection);

startTypeScriptServer(connection, plugin);
