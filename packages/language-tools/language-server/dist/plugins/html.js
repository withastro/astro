'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.create = void 0;
const language_server_1 = require('@volar/language-server');
const volar_service_html_1 = require('volar-service-html');
const html = __importStar(require('vscode-html-languageservice'));
const vscode_uri_1 = require('vscode-uri');
const index_js_1 = require('../core/index.js');
const html_data_js_1 = require('./html-data.js');
const utils_js_1 = require('./utils.js');
const create = () => {
	const htmlPlugin = (0, volar_service_html_1.create)({
		getCustomData: async (context) => {
			const customData = (await context.env.getConfiguration?.('html.customData')) ?? [];
			const newData = [];
			for (const customDataPath of customData) {
				for (const workspaceFolder of context.env.workspaceFolders) {
					const uri = vscode_uri_1.Utils.resolvePath(workspaceFolder, customDataPath);
					const json = await context.env.fs?.readFile?.(uri);
					if (json) {
						try {
							const data = JSON.parse(json);
							newData.push(html.newHTMLDataProvider(customDataPath, data));
						} catch (error) {
							console.error(error);
						}
						break;
					}
				}
			}
			return [
				...newData,
				html_data_js_1.astroAttributes,
				html_data_js_1.astroElements,
				html_data_js_1.classListAttribute,
			];
		},
	});
	return {
		...htmlPlugin,
		create(context) {
			const htmlPluginInstance = htmlPlugin.create(context);
			return {
				...htmlPluginInstance,
				async provideCompletionItems(document, position, completionContext, token) {
					if (document.languageId !== 'html') return;
					const decoded = context.decodeEmbeddedDocumentUri(vscode_uri_1.URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const root = sourceScript?.generated?.root;
					if (!(root instanceof index_js_1.AstroVirtualCode)) return;
					const offset = document.offsetAt(position);
					// Don't return completions if the current node is a component
					if ((0, utils_js_1.isInComponentStartTag)(root.htmlDocument, offset)) {
						return null;
					}
					const currentNode = root.htmlDocument.findNodeAt(offset);
					const sourceText = root.snapshot.getText(0, root.snapshot.getLength());
					// Let the TypeScript service handle `{...}` expressions in HTML attributes.
					if ((0, utils_js_1.isInsideExpression)(sourceText, currentNode.start, offset)) {
						return null;
					}
					const completions = await htmlPluginInstance.provideCompletionItems(
						document,
						position,
						completionContext,
						token,
					);
					if (!completions) {
						return null;
					}
					// We don't want completions for file references, as they're mostly invalid for Astro
					completions.items = completions.items.filter(
						(completion) => completion.kind !== language_server_1.CompletionItemKind.File,
					);
					return completions;
				},
				// Document links provided by `vscode-html-languageservice` are invalid for Astro
				provideDocumentLinks() {
					return [];
				},
			};
		},
	};
};
exports.create = create;
//# sourceMappingURL=html.js.map
