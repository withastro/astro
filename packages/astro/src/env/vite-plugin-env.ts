import type fsMod from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Plugin, loadEnv } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import {
	ENV_TYPES_FILE,
	MODULE_TEMPLATE_URL,
	TYPES_TEMPLATE_URL,
	VIRTUAL_MODULES_IDS,
	VIRTUAL_MODULES_IDS_VALUES,
} from './constants.js';
import type { EnvSchema } from './schema.js';
import { getEnvFieldType, validateEnvVariable } from './validators.js';
import { parse } from 'acorn';
import type { Node as ESTreeNode } from 'estree-walker';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

// TODO: reminders for when astro:env comes out of experimental
// Types should always be generated (like in types/content.d.ts). That means the client module will be empty
// and server will only contain getSecret for unknown variables. Then, specifying a schema should only add
// variables as needed. For secret variables, it will only require specifying SecretValues and it should get
// merged with the static types/content.d.ts

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	mode: 'dev' | 'build' | string;
	fs: typeof fsMod;
}

export function astroEnv({
	settings,
	mode,
	fs,
}: AstroEnvVirtualModPluginParams): Plugin | undefined {
	if (!settings.config.experimental.env) {
		return;
	}
	const schema = settings.config.experimental.env.schema ?? {};

	let templates: { client: string; server: string; internal: string } | null = null;

	return {
		name: 'astro-env-plugin',
		enforce: 'pre',
		buildStart() {
			const loadedEnv = loadEnv(
				mode === 'dev' ? 'development' : 'production',
				fileURLToPath(settings.config.root),
				''
			);
			for (const [key, value] of Object.entries(loadedEnv)) {
				if (value !== undefined) {
					process.env[key] = value;
				}
			}

			const validatedVariables = validatePublicVariables({ schema, loadedEnv });

			const clientTemplates = getClientTemplates({ validatedVariables });
			const serverTemplates = getServerTemplates({ validatedVariables, schema, fs });

			templates = {
				client: clientTemplates.module,
				server: serverTemplates.module,
				internal: `export const schema = ${JSON.stringify(schema)};`,
			};
			generateDts({
				settings,
				fs,
				content: getDts({
					fs,
					clientPublic: clientTemplates.types,
					server: serverTemplates.types,
				}),
			});
		},
		buildEnd() {
			templates = null;
		},
		resolveId(id) {
			if (VIRTUAL_MODULES_IDS_VALUES.has(id)) {
				return resolveVirtualModuleId(id);
			}
		},
		load(id, options) {
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.client)) {
				return templates!.client;
			}
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.server)) {
				if (options?.ssr) {
					return templates!.server;
				}
				throw new AstroError({
					...AstroErrorData.ServerOnlyModule,
					message: AstroErrorData.ServerOnlyModule.message(VIRTUAL_MODULES_IDS.server),
				});
			}
			if (id === resolveVirtualModuleId(VIRTUAL_MODULES_IDS.internal)) {
				return templates!.internal;
			}
		},
		transform(code, id) {
			if (!isValidExtension(id)) {
				return null;
			}
			console.log({ id, code });

			let s: MagicString | undefined;
			const ast = parse(code, {
				ecmaVersion: 'latest',
				sourceType: 'module',
			});

			// TODO: get
			const secretsKeys = ['KNOWN_SECRET'];
			const usedSecrets: Array<string> = [];
			const protectedNodes: Array<ESTreeNode> = [];

			function updateAST(node: ESTreeNode, content: string) {
				s ??= new MagicString(code);
				s.overwrite((node as any).start, (node as any).end, content);
			}

			function isNodeProtected(node: ESTreeNode) {
				for (const n of protectedNodes) {
					if ((node as any).start === (n as any).start && (node as any).end === (n as any).end) {
						return true;
					}
				}
				return false;
			}

			// TODO: support import * as X; X.FOO
			// TODO: support const X = await import(); X.FOO
			// TODO: support object
			walk(ast as ESTreeNode, {
				enter(node, parent) {
					// imports
					if (node.type === 'ImportDeclaration' && node.source.value === 'astro:env/server') {
						for (const specifier of node.specifiers) {
							if (
								specifier.type === 'ImportSpecifier' &&
								secretsKeys.includes(specifier.imported.name)
							) {
								// accounts for imports aliases
								usedSecrets.push(specifier.local.name);
								protectedNodes.push(specifier);
							}
						}
					}

					// await import
					if (
						node.type === 'VariableDeclarator' &&
						node.init &&
						node.init.type === 'AwaitExpression' &&
						node.init.argument.type === 'ImportExpression' &&
						node.init.argument.source.type === 'Literal' &&
						node.init.argument.source.value === 'astro:env/server' &&
						node.id.type === 'ObjectPattern'
					) {
						for (const property of node.id.properties) {
							if (
								property.type === 'Property' &&
								property.key.type === 'Identifier' &&
								property.value.type === 'Identifier'
							) {
								if (
									secretsKeys.includes(property.key.name) ||
									secretsKeys.includes(property.value.name)
								) {
									if (property.key.name === property.value.name) {
										usedSecrets.push(property.value.name);
									} else {
										usedSecrets.push(property.key.name);
									}
									protectedNodes.push(property.key);
									protectedNodes.push(property.value);
								}
							}
						}
					}

					// calls
					if (
						node.type === 'Identifier' &&
						!isNodeProtected(node) &&
						usedSecrets.includes(node.name)
					) {
						const shouldUpdateNode = !parent || parent.type !== 'ImportSpecifier';

						if (shouldUpdateNode) {
							if (
								parent &&
								parent.type === 'Property' &&
								parent.key.type === 'Identifier' &&
								parent.value.type === 'Identifier' &&
								parent.key.name === parent.value.name
							) {
								// object shorthand
								updateAST(parent.value, `${node.name}: ${node.name}()`);
							} else {
								updateAST(node, `${node.name}()`);
							}
						}
					}
				},
			});

			if (s) {
				const code = s.toString();
				console.log({ code });
				return {
					code,
					map: s.generateMap({ hires: 'boundary' }),
				};
			}
		},
	};
}

// TODO: restore
// const EXTENSIONS = ['.astro', '.ts', '.mts', '.tsx', '.js', '.mjs', '.jsx'];
const EXTENSIONS = ['.astro'];
function isValidExtension(id: string) {
	for (const ext of EXTENSIONS) {
		if (id.endsWith(ext)) {
			return true;
		}
	}
	return false;
}

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}

function generateDts({
	content,
	settings,
	fs,
}: {
	content: string;
	settings: AstroSettings;
	fs: typeof fsMod;
}) {
	fs.mkdirSync(settings.dotAstroDir, { recursive: true });
	fs.writeFileSync(new URL(ENV_TYPES_FILE, settings.dotAstroDir), content, 'utf-8');
}

function validatePublicVariables({
	schema,
	loadedEnv,
}: {
	schema: EnvSchema;
	loadedEnv: Record<string, string>;
}) {
	const valid: Array<{ key: string; value: any; type: string; context: 'server' | 'client' }> = [];
	const invalid: Array<{ key: string; type: string }> = [];

	for (const [key, options] of Object.entries(schema)) {
		if (options.access !== 'public') {
			continue;
		}
		const variable = loadedEnv[key];
		const result = validateEnvVariable(variable === '' ? undefined : variable, options);
		if (result.ok) {
			valid.push({ key, value: result.value, type: result.type, context: options.context });
		} else {
			invalid.push({ key, type: result.type });
		}
	}

	if (invalid.length > 0) {
		throw new AstroError({
			...AstroErrorData.EnvInvalidVariables,
			message: AstroErrorData.EnvInvalidVariables.message(
				invalid.map(({ key, type }) => `Variable ${key} is not of type: ${type}.`).join('\n')
			),
		});
	}

	return valid;
}

function getDts({
	clientPublic,
	server,
	fs,
}: {
	clientPublic: string;
	server: string;
	fs: typeof fsMod;
}) {
	const template = fs.readFileSync(TYPES_TEMPLATE_URL, 'utf-8');

	return template.replace('// @@CLIENT@@', clientPublic).replace('// @@SERVER@@', server);
}

function getClientTemplates({
	validatedVariables,
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
}) {
	let module = '';
	let types = '';

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === 'client')) {
		module += `export const ${key} = ${JSON.stringify(value)};`;
		types += `export const ${key}: ${type};	\n`;
	}

	return {
		module,
		types,
	};
}

function getServerTemplates({
	validatedVariables,
	schema,
	fs,
}: {
	validatedVariables: ReturnType<typeof validatePublicVariables>;
	schema: EnvSchema;
	fs: typeof fsMod;
}) {
	let module = fs.readFileSync(MODULE_TEMPLATE_URL, 'utf-8');
	let types = '';

	for (const { key, type, value } of validatedVariables.filter((e) => e.context === 'server')) {
		module += `export const ${key} = ${JSON.stringify(value)};`;
		types += `export const ${key}: ${type};	\n`;
	}

	for (const [key, options] of Object.entries(schema)) {
		if (!(options.context === 'server' && options.access === 'secret')) {
			continue;
		}

		module += `export const ${key} = () => _internalGetSecret(${JSON.stringify(key)})`;
		types += `export const ${key}: ${getEnvFieldType(options)};	\n`;
	}

	return {
		module,
		types,
	};
}
