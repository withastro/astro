import type ts from 'typescript';
import type { Position } from 'vscode-languageserver';
import { getLineAtPosition } from '../../../core/documents';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import type { DocumentSnapshot } from '../snapshots/DocumentSnapshot';

export function isPartOfImportStatement(text: string, position: Position): boolean {
	const line = getLineAtPosition(position, text);
	return /\s*from\s+["'][^"']*/.test(line.slice(0, position.character));
}

export class SnapshotMap {
	private map = new Map<string, DocumentSnapshot>();
	constructor(private languageServiceManager: LanguageServiceManager) {}

	set(fileName: string, snapshot: DocumentSnapshot) {
		this.map.set(fileName, snapshot);
	}

	get(fileName: string) {
		return this.map.get(fileName);
	}

	async retrieve(fileName: string) {
		let snapshot = this.get(fileName);
		if (!snapshot) {
			const snap = await this.languageServiceManager.getSnapshot(fileName);
			this.set(fileName, snap);
			snapshot = snap;
		}
		return snapshot;
	}
}

export function findContainingNode<T extends ts.Node>(
	node: ts.Node,
	textSpan: ts.TextSpan,
	predicate: (node: ts.Node) => node is T
): T | undefined {
	const children = node.getChildren();
	const end = textSpan.start + textSpan.length;

	for (const child of children) {
		if (!(child.getStart() <= textSpan.start && child.getEnd() >= end)) {
			continue;
		}

		if (predicate(child)) {
			return child;
		}

		const foundInChildren = findContainingNode(child, textSpan, predicate);
		if (foundInChildren) {
			return foundInChildren;
		}
	}
}
