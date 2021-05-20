import type { SnapshotFragment, DocumentSnapshot } from '../DocumentSnapshot';
import type { LanguageServiceManager } from '../LanguageServiceManager';

/**
 * Checks if this a section that should be completely ignored
 * because it's purely generated.
 */
export function isInGeneratedCode(text: string, start: number, end: number) {
  const lineStart = text.lastIndexOf('\n', start);
  const lineEnd = text.indexOf('\n', end);
  const lastStart = text.substring(lineStart, start).lastIndexOf('/*Ωignore_startΩ*/');
  const lastEnd = text.substring(lineStart, start).lastIndexOf('/*Ωignore_endΩ*/');
  return lastStart > lastEnd && text.substring(end, lineEnd).includes('/*Ωignore_endΩ*/');
}

/**
 * Checks that this isn't a text span that should be completely ignored
 * because it's purely generated.
 */
export function isNoTextSpanInGeneratedCode(text: string, span: ts.TextSpan) {
  return !isInGeneratedCode(text, span.start, span.start + span.length);
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
      const fragment = await snapshot.getFragment();
      snapshotFragment = { fragment, snapshot };
      this.set(fileName, snapshotFragment);
    }
    return snapshotFragment;
  }

  async retrieveFragment(fileName: string) {
    return (await this.retrieve(fileName)).fragment;
  }
}
