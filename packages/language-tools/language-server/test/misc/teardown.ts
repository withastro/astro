import { describe, it } from 'node:test';
import { getLanguageServer } from '../server.js';

describe('Teardown', () => {
	it('Can teardown', async () => {
		const languageServer = await getLanguageServer();
		languageServer.handle.connection.dispose();
		languageServer.handle.process.kill();
	});
});
