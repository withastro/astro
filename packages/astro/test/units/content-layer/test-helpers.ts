import path from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import type { CollectionStorageDriver, StoredEntry } from '../../../dist/content/storage.js';

/**
 * Creates a temporary directory for tests
 */
export function createTempDir(prefix = 'astro-test-'): URL {
	const tempDir = mkdtempSync(path.join(tmpdir(), prefix));
	return pathToFileURL(tempDir + path.sep);
}

/**
 * Creates a test content config observer for unit tests
 */
export function createTestConfigObserver(collections: Record<string, any>): any {
	const contentConfig = {
		status: 'loaded' as const,
		config: {
			collections,
			digest: 'test-digest',
		},
	};

	return {
		get: () => contentConfig,
		set: () => {},
		subscribe: (fn: (config: typeof contentConfig) => void) => {
			fn(contentConfig);
			return () => {};
		},
	};
}

/**
 * Creates minimal Astro settings for content layer tests
 */
export function createMinimalSettings(root: URL, overrides: Record<string, any> = {}): any {
	const defaultConfig = {
		root,
		srcDir: new URL('./src/', root),
		cacheDir: new URL('./.cache/', root),
		markdown: { processor: unified() },
		experimental: {},
	};

	const overrideConfig = overrides.config || {};
	const settings: Record<string, any> = {
		config: {
			...defaultConfig,
			...overrideConfig,
			// Tests often spread custom markdown options without a processor; preserve the
			// default `unified()` processor so `processor.createRenderer(...)` is always callable.
			markdown: { ...defaultConfig.markdown, ...(overrideConfig.markdown || {}) },
		},
		dotAstroDir: new URL('./.astro/', root),
		contentEntryTypes: [],
		dataEntryTypes: [],
	};

	Object.keys(overrides).forEach((key) => {
		if (key !== 'config') {
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
	const frontmatterStart = lines.findIndex((l: string) => l === '---');
	const frontmatterEnd = lines.findIndex(
		(l: string, i: number) => i > frontmatterStart && l === '---',
	);

	if (frontmatterStart === -1 || frontmatterEnd === -1) {
		const pathname = typeof fileUrl === 'string' ? fileUrl : fileUrl.pathname;
		const slug = path.basename(pathname, '.md');
		return { data: {} as Record<string, any>, body: contents, slug, rawData: {} };
	}

	const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
	const body = lines.slice(frontmatterEnd + 1).join('\n');

	const data: Record<string, any> = {};
	for (const line of frontmatterLines) {
		const [key, ...valueParts] = line.split(':');
		if (key && valueParts.length) {
			const value = valueParts.join(':').trim();
			if (value.startsWith('[') && value.endsWith(']')) {
				const arrayContent = value.slice(1, -1);
				data[key.trim()] = arrayContent
					.split(',')
					.map((item: string) => item.trim().replace(/^["']|["']$/g, ''))
					.filter((item: string) => item.length > 0);
			} else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
				data[key.trim()] = value;
			} else {
				data[key.trim()] = value.replace(/^["']|["']$/g, '');
			}
		}
	}

	const pathname = typeof fileUrl === 'string' ? fileUrl : fileUrl.pathname;
	const slug = path.basename(pathname, '.md');
	return { data, body, slug, rawData: data };
}

/**
 * Creates a markdown entry type configuration
 */
export function createMarkdownEntryType(
	getEntryInfo: (contents: string, fileUrl: string | URL) => any = parseSimpleMarkdownFrontmatter,
) {
	return {
		extensions: ['.md'],
		getEntryInfo: async ({ contents, fileUrl }: { contents: string; fileUrl: string | URL }) => {
			return getEntryInfo(contents, fileUrl);
		},
	};
}

/**
 * Creates a collection storage driver that keeps snapshots in memory. `snapshots` exposes the
 * committed snapshots, keyed by snapshot ID, then by collection, then by entry ID.
 */
export function createMemoryStorageDriver() {
	const snapshots = new Map<string, Map<string, Map<string, StoredEntry>>>();
	const committed = new Map<string, { committedAt: Date; dev: boolean }>();
	const driver = {
		async openWriter({ snapshot, dev }: { snapshot: string; dev: boolean }) {
			const pending = new Map<string, Map<string, StoredEntry>>();
			return {
				async write(collection: string, entries: StoredEntry[]) {
					pending.set(collection, new Map(entries.map((entry) => [entry.id, entry])));
				},
				async commit() {
					snapshots.set(snapshot, pending);
					committed.set(snapshot, { committedAt: new Date(), dev });
				},
			};
		},
		async listSnapshots() {
			return [...committed].map(([snapshot, info]) => ({ snapshot, ...info }));
		},
		async deleteSnapshot(snapshot: string) {
			snapshots.delete(snapshot);
			committed.delete(snapshot);
		},
		async openReader({ snapshot }: { snapshot: string }) {
			const read = (collection: string) => snapshots.get(snapshot)?.get(collection);
			const withoutContent = ({ content: _content, ...entry }: StoredEntry): StoredEntry => entry;
			return {
				async get(collection: string, id: string, { content }: { content: boolean }) {
					const entry = read(collection)?.get(id);
					if (!entry) return undefined;
					return content ? entry : withoutContent(entry);
				},
				async entries(collection: string, { content }: { content: boolean }) {
					const entries = [...(read(collection)?.values() ?? [])];
					return content ? entries : entries.map(withoutContent);
				},
			};
		},
	} satisfies CollectionStorageDriver;
	return { ...driver, snapshots };
}
