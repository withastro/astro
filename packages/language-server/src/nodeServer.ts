import {
	createConnection,
	createServer,
	createTypeScriptProjectProviderFactory,
	loadTsdkByPath,
} from '@volar/language-server/node';
import { createServerOptions } from './languageServerPlugin.js';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
	const tsdk = params.initializationOptions?.typescript?.tsdk

	if (!tsdk) {
		throw new Error('The `typescript.tsdk` init option is required. It should point to a directory containing a `typescript.js` or `tsserverlibrary.js` file, such as `node_modules/typescript/lib`.');
	}

  const {typescript, diagnosticMessages} = loadTsdkByPath(
    tsdk,
    params.locale
  )

	return server.initialize(
		params,
		createTypeScriptProjectProviderFactory(typescript, diagnosticMessages),
		createServerOptions(connection, typescript)
	);
});

connection.onInitialized(() => {
	server.initialized();
});
