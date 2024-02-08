import {
	createConnection,
	createServer,
	createTypeScriptProjectProvider,
} from '@volar/language-server/node';
import { createServerOptions } from './languageServerPlugin.js';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
	return server.initialize(
		params,
		createTypeScriptProjectProvider,
		createServerOptions(connection, server)
	);
});

connection.onInitialized(() => {
	server.initialized();
});
