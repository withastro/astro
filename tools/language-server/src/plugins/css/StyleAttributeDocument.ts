import { Stylesheet } from 'vscode-css-languageservice';
import { Position } from 'vscode-languageserver';
import { getLanguageService } from './service';
import { Document, DocumentMapper, ReadableDocument } from '../../core/documents';

const PREFIX = '__ {';
const SUFFIX = '}';

export class StyleAttributeDocument extends ReadableDocument implements DocumentMapper {
  readonly version = this.parent.version;

  public stylesheet: Stylesheet;
  public languageId = 'css';

  constructor(private readonly parent: Document, private readonly attrStart: number, private readonly attrEnd: number) {
    super();

    this.stylesheet = getLanguageService(this.languageId).parseStylesheet(this);
  }

  /**
   * Get the fragment position relative to the parent
   * @param pos Position in fragment
   */
  getOriginalPosition(pos: Position): Position {
    const parentOffset = this.attrStart + this.offsetAt(pos) - PREFIX.length;
    return this.parent.positionAt(parentOffset);
  }

  /**
   * Get the position relative to the start of the fragment
   * @param pos Position in parent
   */
  getGeneratedPosition(pos: Position): Position {
    const fragmentOffset = this.parent.offsetAt(pos) - this.attrStart + PREFIX.length;
    return this.positionAt(fragmentOffset);
  }

  /**
   * Returns true if the given parent position is inside of this fragment
   * @param pos Position in parent
   */
  isInGenerated(pos: Position): boolean {
    const offset = this.parent.offsetAt(pos);
    return offset >= this.attrStart && offset <= this.attrEnd;
  }

  /**
   * Get the fragment text from the parent
   */
  getText(): string {
    return PREFIX + this.parent.getText().slice(this.attrStart, this.attrEnd) + SUFFIX;
  }

  /**
   * Returns the length of the fragment as calculated from the start and end position
   */
  getTextLength(): number {
    return PREFIX.length + this.attrEnd - this.attrStart + SUFFIX.length;
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
}
