import { getLanguageServer } from './server.js';
export async function mochaGlobalTeardown() {
	const languageServer = await getLanguageServer();
	languageServer.handle.connection.dispose();
}
