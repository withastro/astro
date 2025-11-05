import { type CompletionItem, CompletionItemKind, TextEdit } from '@volar/language-server';
import type { FrontmatterStatus } from '../../core/parseAstro.js';

export function getSnippetCompletions(frontmatter: FrontmatterStatus): CompletionItem[] {
	if (frontmatter.status === 'doesnt-exist') return [];

	const frontmatterStartPosition = {
		line: frontmatter.position.start.line,
		character: frontmatter.position.start.column - 1,
	};

	return [
		{
			label: 'interface Props',
			kind: CompletionItemKind.Snippet,
			labelDetails: { description: 'Create a new interface to type your props' },
			documentation: {
				kind: 'markdown',
				value: [
					'Create a new interface to type your props.',
					'\n',
					'[Astro reference](https://docs.astro.build/en/guides/typescript/#component-props)',
				].join('\n'),
			},
			insertTextFormat: 2,
			filterText: 'interface props',
			insertText: 'interface Props {\n\t$1\n}',
		},
		{
			label: 'getStaticPaths',
			kind: CompletionItemKind.Snippet,
			labelDetails: { description: 'Create a new getStaticPaths function' },
			documentation: {
				kind: 'markdown',
				value: [
					'Create a new getStaticPaths function.',
					'\n',
					'[Astro reference](https://docs.astro.build/en/reference/api-reference/#getstaticpaths)',
				].join('\n'),
			},
			insertText:
				'export const getStaticPaths = (() => {\n\t$1\n\treturn [];\n}) satisfies GetStaticPaths;',
			additionalTextEdits: [
				TextEdit.insert(frontmatterStartPosition, 'import type { GetStaticPaths } from "astro";\n'),
			],
			filterText: 'getstaticpaths',
			insertTextFormat: 2,
		},
		{
			label: 'prerender',
			kind: CompletionItemKind.Snippet,
			labelDetails: { description: 'Add prerender export' },
			documentation: {
				kind: 'markdown',
				value: [
					'Add prerender export. When [using server-side rendering](https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project), this value will be used to determine whether to prerender the page or not.',
					'\n',
					'[Astro reference](https://docs.astro.build/en/guides/server-side-rendering/#configuring-individual-routes)',
				].join('\n'),
			},
			insertText: 'export const prerender = ${1|true,false|}',
			insertTextFormat: 2,
		},
	];
}
