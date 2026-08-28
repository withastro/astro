import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as vscode from 'vscode';

const TYPESCRIPT_EXTENSION_ID = 'TypeScriptTeam.native-preview';
const CONTRIBUTOR_ID = 'astro-build.astro-vscode';
const MAPPER_PACKAGE = '@astrojs/ts-content-mapper';

interface ContentMapperManifest {
	readonly name: string;
	readonly version?: string;
	readonly exec: readonly string[];
	readonly cwd?: vscode.Uri;
	readonly compilerOptions?: readonly string[];
	readonly dynamicConfig?: boolean;
}

interface ContentMapperContribution {
	readonly extensions: readonly string[];
	readonly inferredProjectContribution?: {
		readonly options?: Readonly<Record<string, unknown>>;
		readonly manifest: ContentMapperManifest;
	};
}

interface TypeScriptExtensionApi {
	registerContentMappers?(
		contributorId: string,
		contributions: readonly ContentMapperContribution[],
	): vscode.Disposable;
}

interface MapperPackageJson {
	name?: string;
	version?: string;
	typescript?: {
		contentMapper?: {
			exec?: string[];
			compilerOptions?: string[];
			dynamicConfig?: boolean;
		};
	};
}

export const useTsgoSections = ['js/ts', 'typescript'];

export function isTsgoEnabled(): boolean {
	return useTsgoSections.some(
		(section) =>
			vscode.workspace.getConfiguration(section).get<boolean>('experimental.useTsgo') === true,
	);
}

function readManifest(packageJsonPath: string): ContentMapperManifest | undefined {
	const require = createRequire(packageJsonPath);
	const packageJson = require(packageJsonPath) as MapperPackageJson;
	const contentMapper = packageJson.typescript?.contentMapper;

	if (!packageJson.name || !contentMapper?.exec?.length) {
		return undefined;
	}

	const packageDirectory = path.dirname(packageJsonPath);
	const [command, ...args] = contentMapper.exec;

	return {
		name: packageJson.name,
		version: packageJson.version,
		// `exec` names `node`, but the extension host's own binary is the one guaranteed to be present.
		exec: [
			command === 'node' ? process.execPath : command,
			...args.map((arg) => path.resolve(packageDirectory, arg)),
		],
		cwd: vscode.Uri.file(packageDirectory),
		compilerOptions: contentMapper.compilerOptions,
		dynamicConfig: contentMapper.dynamicConfig,
	};
}

function resolveMapperManifest(context: vscode.ExtensionContext) {
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		try {
			const require = createRequire(path.join(folder.uri.fsPath, 'package.json'));
			return readManifest(require.resolve(`${MAPPER_PACKAGE}/package.json`));
		} catch {
			// The project does not depend on the mapper; fall through to the bundled copy.
		}
	}

	const bundled = context.asAbsolutePath(path.join('dist', 'contentMapper', 'package.json'));
	return existsSync(bundled) ? readManifest(bundled) : undefined;
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

	let manifest: ContentMapperManifest | undefined;
	try {
		manifest = resolveMapperManifest(context);
	} catch (error) {
		console.error(`Failed to resolve ${MAPPER_PACKAGE}:`, error);
	}

	try {
		context.subscriptions.push(
			api.registerContentMappers(CONTRIBUTOR_ID, [
				{
					extensions: ['.astro'],
					// Only reaches Astro files outside a configured project; a tsconfig entry wins.
					...(manifest ? { inferredProjectContribution: { options: {}, manifest } } : {}),
				},
			]),
		);
	} catch (error) {
		console.error('Failed to register the Astro content mapper:', error);
		return false;
	}

	return true;
}
