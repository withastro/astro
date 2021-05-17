import { Stylesheet, TextDocument } from 'vscode-css-languageservice';
import { Position } from 'vscode-languageserver';
import { getLanguageService } from './service';
import { Document, DocumentMapper, ReadableDocument, TagInformation } from '../../core/documents/index';

export interface CSSDocumentBase extends DocumentMapper, TextDocument {
    languageId: string;
    stylesheet: Stylesheet;
}

export class CSSDocument extends ReadableDocument implements DocumentMapper {
    private styleInfo: Pick<TagInformation, 'attributes' | 'start' | 'end'>;
    readonly version = this.parent.version;

    public stylesheet: Stylesheet;
    public languageId: string;

    constructor(private parent: Document) {
        super();

        if (this.parent.styleInfo) {
            this.styleInfo = this.parent.styleInfo;
        } else {
            this.styleInfo = {
                attributes: {},
                start: -1,
                end: -1
            };
        }

        this.languageId = this.language;
        this.stylesheet = getLanguageService(this.language).parseStylesheet(this);
    }

    /**
     * Get the fragment position relative to the parent
     * @param pos Position in fragment
     */
    getOriginalPosition(pos: Position): Position {
        const parentOffset = this.styleInfo.start + this.offsetAt(pos);
        return this.parent.positionAt(parentOffset);
    }

    /**
     * Get the position relative to the start of the fragment
     * @param pos Position in parent
     */
    getGeneratedPosition(pos: Position): Position {
        const fragmentOffset = this.parent.offsetAt(pos) - this.styleInfo.start;
        return this.positionAt(fragmentOffset);
    }

    /**
     * Returns true if the given parent position is inside of this fragment
     * @param pos Position in parent
     */
    isInGenerated(pos: Position): boolean {
        const offset = this.parent.offsetAt(pos);
        return offset >= this.styleInfo.start && offset <= this.styleInfo.end;
    }

    /**
     * Get the fragment text from the parent
     */
    getText(): string {
        return this.parent.getText().slice(this.styleInfo.start, this.styleInfo.end);
    }

    /**
     * Returns the length of the fragment as calculated from the start and end positon
     */
    getTextLength(): number {
        return this.styleInfo.end - this.styleInfo.start;
    }

    /**
     * Return the parent file path
     */
    getFilePath(): string | null {
        return this.parent.getFilePath();
    }

    getURL() {
        return this.parent.getURL();
    }

    getAttributes() {
        return this.styleInfo.attributes;
    }

    private get language() {
        const attrs = this.getAttributes();
        return attrs.lang || attrs.type || 'css';
    }
}
