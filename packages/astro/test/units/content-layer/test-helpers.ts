import path from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Creates a temporary directory for tests
 */
export function createTempDir(prefix = 'astro-test-') {
	const tempDir = mkdtempSync(path.join(tmpdir(), prefix));
	return pathToFileURL(tempDir + path.sep);
}

/**
 * Creates a test content config observer for unit tests
 */
export function createTestConfigObserver(collections: Record<string, any>) {
	const contentConfig = {
		status: 'loaded',
		config: {
			collections,
			digest: 'test-digest',
		},
	};

	return {
		get: () => contentConfig,
		set: () => {},
		subscribe: (fn: (_contentConfig: typeof contentConfig) => void) => {
			// Call immediately with current config
			fn(contentConfig);
			return () => {};
		},
	};
}

/**
 * Creates minimal Astro settings for content layer tests
 */
export function createMinimalSettings(root: URL, overrides: Record<string, any> = {}) {
	const defaultConfig = {
		root,
		srcDir: new URL('./src/', root),
		cacheDir: new URL('./.cache/', root),
		markdown: {},
		experimental: {},
	};

	const settings = {
		config: {
			...defaultConfig,
			...(overrides.config || {}),
		},
		dotAstroDir: new URL('./.astro/', root),
		contentEntryTypes: [],
		dataEntryTypes: [],
	};

	// Apply non-config overrides
	Object.keys(overrides).forEach((key) => {
		if (key !== 'config') {
			// @ts-expect-error
			settings[key] = overrides[key];
		}
	});

	return settings;
}

/**
 * Simple YAML frontmatter parser for markdown files
 */
export function parseSimpleMarkdownFrontmatter(contents: string, fileUrl: string | URL) {
	const lines = contents.split('\n');
	const frontmatterStart = lines.findIndex((l) => l === '---');
	const frontmatterEnd = lines.findIndex((l, i) => i > frontmatterStart && l === '---');

	const slug = path.basename(fileUrl instanceof URL ? fileUrl.pathname : fileUrl, '.md');
	if (frontmatterStart === -1 || frontmatterEnd === -1) {
		return { data: {}, body: contents, slug, rawData: {} };
	}

	const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
	const body = lines.slice(frontmatterEnd + 1).join('\n');

	// Parse YAML-like frontmatter
	const data: Record<string, any> = {};
	for (const line of frontmatterLines) {
		const [key, ...valueParts] = line.split(':');
		if (key && valueParts.length) {
			const value = valueParts.join(':').trim();
			if (value.startsWith('[') && value.endsWith(']')) {
				// Parse YAML-style arrays
				const arrayContent = value.slice(1, -1);
				data[key.trim()] = arrayContent
					.split(',')
					.map((item) => item.trim().replace(/^["']|["']$/g, ''))
					.filter((item) => item.length > 0);
			} else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
				// Keep dates as strings for schema to parse
				data[key.trim()] = value;
			} else {
				// Remove quotes if present
				data[key.trim()] = value.replace(/^["']|["']$/g, '');
			}
		}
	}

	return { data, body, slug, rawData: data };
}

/**
 * Creates a markdown entry type configuration
 */
export function createMarkdownEntryType(getEntryInfo = parseSimpleMarkdownFrontmatter) {
	return {
		extensions: ['.md'],
		getEntryInfo: async ({ contents, fileUrl }: { contents: string; fileUrl: string | URL }) => {
			return getEntryInfo(contents, fileUrl);
		},
	};
}
