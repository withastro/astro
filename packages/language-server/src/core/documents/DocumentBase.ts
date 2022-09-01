import type { Position } from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { getLineOffsets, offsetAt, positionAt } from './utils';

/**
 * Represents a textual document.
 */
export abstract class ReadableDocument implements TextDocument {
	/**
	 * Get the text content of the document
	 */
	abstract getText(): string;

	/**
	 * Returns the url of the document
	 */
	abstract getURL(): string;

	/**
	 * Returns the file path if the url scheme is file
	 */
	abstract getFilePath(): string | null;

	/**
	 * Current version of the document.
	 */
	public version = 0;

	/**
	 * Should be cleared when there's an update to the text
	 */
	protected lineOffsets?: number[];

	/**
	 * Get the length of the document's content
	 */
	getTextLength(): number {
		return this.getText().length;
	}

	/**
	 * Get the line and character based on the offset
	 * @param offset The index of the position
	 */
	positionAt(offset: number): Position {
		return positionAt(offset, this.getText(), this.getLineOffsets());
	}

	/**
	 * Get the index of the line and character position
	 * @param position Line and character position
	 */
	offsetAt(position: Position): number {
		return offsetAt(position, this.getText(), this.getLineOffsets());
	}

	getLineUntilOffset(offset: number): string {
		const { line, character } = this.positionAt(offset);
		return this.lines[line].slice(0, character);
	}

	private getLineOffsets() {
		if (!this.lineOffsets) {
			this.lineOffsets = getLineOffsets(this.getText());
		}
		return this.lineOffsets;
	}

	/**
	 * Implements TextDocument
	 */
	get uri(): string {
		return this.getURL();
	}

	get lines(): string[] {
		return this.getText().split(/\r?\n/);
	}

	get lineCount(): number {
		return this.lines.length;
	}

	abstract languageId: string;
}

/**
 * Represents a textual document that can be manipulated.
 */
export abstract class WritableDocument extends ReadableDocument {
	/**
	 * Set the text content of the document.
	 * Implementers should set `lineOffsets` to `undefined` here.
	 * @param text The new text content
	 */
	abstract setText(text: string): void;

	/**
	 * Update the text between two positions.
	 * @param text The new text slice
	 * @param start Start offset of the new text
	 * @param end End offset of the new text
	 */
	update(text: string, start: number, end: number): void {
		this.lineOffsets = undefined;
		const content = this.getText();
		this.setText(content.slice(0, start) + text + content.slice(end));
	}
}
