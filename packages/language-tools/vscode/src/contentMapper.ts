import * as vscode from 'vscode';

const TYPESCRIPT_EXTENSION_ID = 'TypeScriptTeam.native-preview';
const CONTRIBUTOR_ID = 'astro-build.astro-vscode';

interface ContentMapperContribution {
	readonly extensions: readonly string[];
}

interface TypeScriptExtensionApi {
	registerContentMappers?(
		contributorId: string,
		contributions: readonly ContentMapperContribution[],
	): vscode.Disposable;
}

export const useTsgoSections = ['js/ts', 'typescript'];

export function isTsgoEnabled(): boolean {
	return useTsgoSections.some(
		(section) =>
			vscode.workspace.getConfiguration(section).get<boolean>('experimental.useTsgo') === true,
	);
}

/** Hands `.astro` to TypeScript 7's content mapper, returning whether it took over type-checking. */
export async function registerContentMapper(context: vscode.ExtensionContext): Promise<boolean> {
	if (!isTsgoEnabled()) {
		return false;
	}

	const extension = vscode.extensions.getExtension<TypeScriptExtensionApi>(TYPESCRIPT_EXTENSION_ID);
	if (!extension) {
		return false;
	}

	const api = await extension.activate();
	if (typeof api?.registerContentMappers !== 'function') {
		console.info(
			`The installed ${TYPESCRIPT_EXTENSION_ID} build does not support content mappers. Astro files will keep using the language server's TypeScript support.`,
		);
		return false;
	}

	try {
		context.subscriptions.push(
			api.registerContentMappers(CONTRIBUTOR_ID, [{ extensions: ['.astro'] }]),
		);
	} catch (error) {
		console.error('Failed to register the Astro content mapper:', error);
		return false;
	}

	return true;
}
