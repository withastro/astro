// TODO: This is a workaround around a missing API in Sätteri. The visitor architecture naturally does not provide
// a way to "visit" the root and prepend nodes (it'd kill performance), as such this file currently works around that
// in a clumsy way. Once Sätteri ship an actual API to prepend / append, this file could get removed.

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const exportConstPartialTrueRe = /export\s+const\s+partial\s*=\s*true/;
const leadingComponentRe = /^\s*<\s*([A-Za-z][A-Za-z0-9]*)\b/;

// Scans MDX source directly because Sätteri exposes no root-level visitor.
// Skips imports/exports/blank lines and bails when the first content line is a
// capitalized JSX element (treated as a wrapping layout).
export function shouldAddCharset(content: string, filePath: string, srcDir: URL): boolean {
	const srcDirPath = fileURLToPath(srcDir).replace(/\\/g, '/');
	const pagesDir = path.posix.join(srcDirPath, 'pages');
	const normalizedFilePath = filePath.replace(/\\/g, '/');
	if (!normalizedFilePath.startsWith(pagesDir)) return false;

	const segments = normalizedFilePath.slice(pagesDir.length).split('/');
	if (segments.some((part) => part.startsWith('_'))) return false;

	if (exportConstPartialTrueRe.test(content)) return false;

	// Strip MDX JSX expression comments `{/* ... */}` so they don't trip the
	// "first content" scan below — they're not the wrapping layout.
	const stripped = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

	for (const rawLine of stripped.split('\n')) {
		const line = rawLine.trim();
		if (!line) continue;
		if (line.startsWith('import ') || line.startsWith('export ')) continue;
		if (line.startsWith('//') || line.startsWith('/*')) continue;
		// Other JSX expressions (e.g. `{someVar}` at top level) aren't a wrapping layout.
		if (line.startsWith('{')) continue;

		const match = leadingComponentRe.exec(line);
		if (match) {
			const tag = match[1];
			// Capitalized tag suggests a user-provided wrapping layout component
			if (tag[0] >= 'A' && tag[0] <= 'Z') return false;
		}
		break;
	}

	return true;
}
