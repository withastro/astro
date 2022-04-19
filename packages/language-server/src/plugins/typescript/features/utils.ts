import type { SnapshotFragment, DocumentSnapshot } from '../snapshots/DocumentSnapshot';
import type { LanguageServiceManager } from '../LanguageServiceManager';
import { Position } from 'vscode-languageserver';
import { getLineAtPosition } from '../../../core/documents';

export function isPartOfImportStatement(text: string, position: Position): boolean {
	const line = getLineAtPosition(position, text);
	return /\s*from\s+["'][^"']*/.test(line.slice(0, position.character));
}

export class SnapshotFragmentMap {
	private map = new Map<string, { fragment: SnapshotFragment; snapshot: DocumentSnapshot }>();
	constructor(private languageServiceManager: LanguageServiceManager) {}

	set(fileName: string, content: { fragment: SnapshotFragment; snapshot: DocumentSnapshot }) {
		this.map.set(fileName, content);
	}

	get(fileName: string) {
		return this.map.get(fileName);
	}

	getFragment(fileName: string) {
		return this.map.get(fileName)?.fragment;
	}

	async retrieve(fileName: string) {
		let snapshotFragment = this.get(fileName);
		if (!snapshotFragment) {
			const snapshot = await this.languageServiceManager.getSnapshot(fileName);
			const fragment = await snapshot.createFragment();
			snapshotFragment = { fragment, snapshot };
			this.set(fileName, snapshotFragment);
		}
		return snapshotFragment;
	}

	async retrieveFragment(fileName: string) {
		return (await this.retrieve(fileName)).fragment;
	}
}
