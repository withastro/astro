import type { SerializedStaticImage } from '../../assets/types.js';
import { getRecordTarget } from './scope.js';

// Content entries only matter per page, so the ambient store has no collector for them.
export function recordContentEntryRender(filePath: string | undefined): void {
	if (!filePath) return;
	getRecordTarget()?.contentEntries?.add(filePath);
}

// An array, not a set: replay depends on every record arriving.
export function recordStaticImage(image: SerializedStaticImage): void {
	getRecordTarget()?.staticImages?.push(image);
}

export function recordReferencedImage(fsPath: string): void {
	getRecordTarget()?.referencedImages?.add(fsPath);
}
