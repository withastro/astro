import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './utils.js';

// Register things for typesafety
declare module 'astro:content' {
	interface FancyRender {
		'.mdoc': {
			getParsed(): string;
			getTransformed(): Promise<string>;
		};
	}
}

type ContentEntryType = {
	extensions: string[];
	getEntryInfo(params: { fileUrl: URL }): Promise<{
		data: Record<string, unknown>;
		/**
		 * Used for error hints to point to correct line and location
		 * Should be the untouched data as read from the file,
		 * including newlines
		 */
		rawData: string;
		body: string;
		slug: string;
	}>;
};

export const contentEntryTypes: ContentEntryType[] = [
	{
		extensions: ['.mdoc'],
		async getEntryInfo({ fileUrl }) {
			const rawContents = await fs.promises.readFile(fileUrl, 'utf-8');
			const parsed = parseFrontmatter(rawContents, fileURLToPath(fileUrl));
			return {
				data: parsed.data,
				body: parsed.content,
				slug: parsed.data.slug,
				rawData: parsed.matter,
			};
		},
	},
];
