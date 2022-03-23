import { ConfigManager } from '../src/core/config';
import { AstroDocument, DocumentManager } from '../src/core/documents';

export function createEnvironment(content: string) {
	const document = new AstroDocument('file:///hello.astro', content);
	const docManager = new DocumentManager(() => document);
	const configManager = new ConfigManager();
	docManager.openDocument(<any>'some doc');

	return { document, configManager };
}
