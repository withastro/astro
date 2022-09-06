import type { HTMLDocument, Range } from 'vscode-html-languageservice';
import { urlToPath } from '../../utils';
import { WritableDocument } from './DocumentBase';
import { AstroMetadata, parseAstro } from './parseAstro';
import { parseHtml } from './parseHtml';
import { extractScriptTags, extractStyleTags, TagInformation } from './utils';

export class AstroDocument extends WritableDocument {
	languageId = 'astro';
	astroMeta!: AstroMetadata;
	html!: HTMLDocument;
	styleTags!: TagInformation[];
	scriptTags!: TagInformation[];

	constructor(public url: string, public content: string) {
		super();

		this.updateDocInfo();
	}

	private updateDocInfo() {
		this.astroMeta = parseAstro(this.content);
		this.html = parseHtml(this.content, this.astroMeta);
		this.styleTags = extractStyleTags(this.content, this.html);
		this.scriptTags = extractScriptTags(this.content, this.html);
	}

	setText(text: string): void {
		this.content = text;
		this.version++;
		this.updateDocInfo();
	}

	getText(range?: Range | undefined): string {
		if (range) {
			const start = this.offsetAt(range.start);
			const end = this.offsetAt(range.end);
			return this.content.substring(start, end);
		}
		return this.content;
	}

	getURL(): string {
		return this.url;
	}

	getFilePath(): string | null {
		return urlToPath(this.url);
	}
}
