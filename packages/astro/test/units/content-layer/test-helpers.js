import path from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Creates a temporary directory for tests
 * @param {string} prefix - Optional prefix for the temp directory name
 * @returns {URL} The file URL of the created temp directory
 */
export function createTempDir(prefix = 'astro-test-') {
	const tempDir = mkdtempSync(path.join(tmpdir(), prefix));
	return pathToFileURL(tempDir + path.sep);
}

/**
 * Creates a test content config observer for unit tests
 * @param {Object} collections - The collections configuration
 * @returns {Object} A mock content config observer
 */
export function createTestConfigObserver(collections) {
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
		subscribe: (fn) => {
			// Call immediately with current config
			fn(contentConfig);
			return () => {};
		},
	};
}

/**
 * Creates minimal Astro settings for content layer tests
 * @param {URL} root - The root URL for the test
 * @param {Object} overrides - Optional overrides for specific settings
 * @returns {Object} Astro settings object
 */
export function createMinimalSettings(root, overrides = {}) {
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
			settings[key] = overrides[key];
		}
	});

	return settings;
}

/**
 * Simple YAML frontmatter parser for markdown files
 * @param {string} contents - The file contents
 * @param {string} fileUrl - The file URL
 * @returns {Object} Parsed frontmatter data, body, and slug
 */
export function parseSimpleMarkdownFrontmatter(contents, fileUrl) {
	const lines = contents.split('\n');
	const frontmatterStart = lines.findIndex((l) => l === '---');
	const frontmatterEnd = lines.findIndex((l, i) => i > frontmatterStart && l === '---');

	if (frontmatterStart === -1 || frontmatterEnd === -1) {
		const slug = path.basename(fileUrl.pathname || fileUrl, '.md');
		return { data: {}, body: contents, slug, rawData: {} };
	}

	const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
	const body = lines.slice(frontmatterEnd + 1).join('\n');

	// Parse YAML-like frontmatter
	const data = {};
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

	const slug = path.basename(fileUrl.pathname || fileUrl, '.md');
	return { data, body, slug, rawData: data };
}

/**
 * Creates a markdown entry type configuration
 * @param {Function} getEntryInfo - Optional custom getEntryInfo function
 * @returns {Object} Entry type configuration for markdown files
 */
export function createMarkdownEntryType(getEntryInfo = parseSimpleMarkdownFrontmatter) {
	return {
		extensions: ['.md'],
		getEntryInfo: async ({ contents, fileUrl }) => {
			if (typeof fileUrl === 'string') {
				return getEntryInfo(contents, fileUrl);
			}
			return getEntryInfo(contents, fileUrl);
		},
	};
}
