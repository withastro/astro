import type { FileMapping } from './source-mapper';

// Note that this is a bit of a hack until the new compiler with proper
// source map support.

interface Astro2TSXOptions {
	filename: string | undefined;
	isTsFile: boolean;
}

interface Astro2TSXResult {
	code: string;
	map: {
		mappings: FileMapping;
	};
}

export function astro2tsx(code: string, options: Astro2TSXOptions): Astro2TSXResult {
	const compiled = transformContent(code);

	const result: Astro2TSXResult = {
		code: compiled,
		map: {
			mappings: [],
		},
	};

	return result;
}

// This is hacky but it works for now
function addProps(content: string): string {
	let defaultExportType = 'Record<string, any>';

	if (/(interface|type) Props/.test(content)) {
		defaultExportType = 'Props';
	}

	return '\n' + `export default function (props: ${defaultExportType}): string;`;
}

function transformContent(content: string) {
	const ts = content.replace(/---/g, '///');
	return (
		ts +
		// Add TypeScript definitions
		addProps(ts)
	);
}
