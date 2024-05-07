import {
	createConnection,
	createServer,
	createTypeScriptProjectProvider,
	loadTsdkByPath,
} from '@volar/language-server/node';
import { getLanguagePlugins, getLanguageServicePlugins } from './languageServerPlugin.js';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
	const tsdk = params.initializationOptions?.typescript?.tsdk;

	if (!tsdk) {
		throw new Error(
			'The `typescript.tsdk` init option is required. It should point to a directory containing a `typescript.js` or `tsserverlibrary.js` file, such as `node_modules/typescript/lib`.'
		);
	}

	const { typescript, diagnosticMessages } = loadTsdkByPath(tsdk, params.locale);

	return server.initialize(
		params,
		getLanguageServicePlugins(connection, typescript),
		createTypeScriptProjectProvider(typescript, diagnosticMessages, (env, project) =>
			getLanguagePlugins(connection, typescript, env, project.configFileName)
		)
	);
});

connection.onInitialized(() => {
	server.initialized();
	server.watchFiles([
		`**/*.{${[
			'js',
			'cjs',
			'mjs',
			'ts',
			'cts',
			'mts',
			'jsx',
			'tsx',
			'json',
			'astro',
			'vue',
			'svelte',
		].join(',')}}`,
	]);
});
