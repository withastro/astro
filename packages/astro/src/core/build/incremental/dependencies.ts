import fsMod from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { AstroSettings } from '../../../types/astro.js';
import { prependForwardSlash } from '../../path.js';
import { normalizePath } from '../../viteUtils.js';
import { cleanUrl, normalizeFilename } from '../../../vite-plugin-utils/index.js';
import { appendDirectoryUrl, arraysEqual } from './common.js';
import {
	CONTENT_STORE_DATA_DEPENDENCY_KEY,
	FILE_DEPENDENCY_KEY_PREFIX,
	type IncrementalBuildDependencyDigests,
	type IncrementalBuildDependencyKey,
	type IncrementalBuildDataDigests,
} from './types.js';

export function addDependencyKeys(
	target: Set<IncrementalBuildDependencyKey>,
	keys: Iterable<IncrementalBuildDependencyKey>,
) {
	for (const key of keys) {
		target.add(key);
	}
}

export function createFileDependencyKeys(
	settings: AstroSettings,
	ids: Iterable<string> | undefined,
	fs: typeof fsMod,
): IncrementalBuildDependencyKey[] {
	const dependencyKeys = new Set<IncrementalBuildDependencyKey>();
	for (const id of ids ?? []) {
		const dependencyKey = createFileDependencyKey(settings, id, fs);
		if (dependencyKey) {
			dependencyKeys.add(dependencyKey);
		}
	}
	return Array.from(dependencyKeys).sort((left, right) => left.localeCompare(right));
}

export function createFileDependencyKey(
	settings: AstroSettings,
	id: string,
	fs: typeof fsMod,
): IncrementalBuildDependencyKey | undefined {
	const normalizedId = normalizeTrackedDependencyId(settings, id);
	const resolvedPath = resolveTrackedDependencyPath(settings, normalizedId);
	if (!resolvedPath) {
		return undefined;
	}
	const normalizedPathValue = normalizePath(resolvedPath);
	if (
		normalizedPathValue.includes('/node_modules/') ||
		normalizedPathValue.includes('/dist/') ||
		!fs.existsSync(resolvedPath)
	) {
		return undefined;
	}
	return `${FILE_DEPENDENCY_KEY_PREFIX}${toProjectRelativeId(settings, normalizedPathValue)}`;
}

export function normalizeTrackedDependencyId(settings: AstroSettings, id: string): string {
	if (!id) {
		return id;
	}

	const cleanedId = cleanUrl(id);
	if (
		cleanedId.startsWith('\0') ||
		cleanedId.startsWith('/@id/') ||
		cleanedId.startsWith('virtual:')
	) {
		return cleanedId;
	}
	if (cleanedId.startsWith('file://')) {
		return toProjectRelativeId(settings, normalizePath(fileURLToPath(cleanedId)));
	}
	if (cleanedId.startsWith('/')) {
		return toProjectRelativeId(
			settings,
			normalizePath(normalizeFilename(cleanedId, settings.config.root)),
		);
	}
	if (path.isAbsolute(cleanedId)) {
		return toProjectRelativeId(settings, normalizePath(cleanedId));
	}
	if (/^[a-z]+:/i.test(cleanedId)) {
		return cleanedId;
	}
	return cleanedId;
}

function resolveTrackedDependencyPath(settings: AstroSettings, id: string): string | undefined {
	if (!id || id.startsWith('\0') || id.startsWith('/@id/') || id.startsWith('virtual:')) {
		return undefined;
	}
	if (id.startsWith('/.astro/')) {
		return undefined;
	}
	if (id.startsWith('/')) {
		return fileURLToPath(new URL(`.${id}`, settings.config.root));
	}
	if (path.isAbsolute(id)) {
		return id;
	}
	return undefined;
}

export function usesContentDataStore(id: string): boolean {
	const cleanedId = cleanUrl(id);
	return (
		cleanedId === '\0astro:data-layer-content' ||
		cleanedId === '\0astro:content' ||
		cleanedId === '/.astro/content-assets.mjs' ||
		cleanedId === '/.astro/content-modules.mjs'
	);
}

export function createDependencyDigests(
	settings: AstroSettings,
	keys: Set<IncrementalBuildDependencyKey>,
	fs: typeof fsMod,
): IncrementalBuildDependencyDigests {
	return Object.fromEntries(
		Array.from(keys)
			.sort((left, right) => left.localeCompare(right))
			.map((key) => [key, createDependencyDigest(settings, key, fs)]),
	);
}

function createDependencyDigest(
	settings: AstroSettings,
	key: IncrementalBuildDependencyKey,
	fs: typeof fsMod,
): string {
	if (!key.startsWith(FILE_DEPENDENCY_KEY_PREFIX)) {
		return 'untracked';
	}
	const filePath = resolveFileDependencyKeyPath(settings, key);
	return filePath ? createFileDigest(filePath, fs) : 'missing';
}

function resolveFileDependencyKeyPath(
	settings: AstroSettings,
	key: IncrementalBuildDependencyKey,
): string | undefined {
	if (!key.startsWith(FILE_DEPENDENCY_KEY_PREFIX)) {
		return undefined;
	}
	const id = key.slice(FILE_DEPENDENCY_KEY_PREFIX.length);
	return resolveTrackedDependencyPath(settings, id);
}

export function createDataDigests(
	settings: AstroSettings,
	keys: Set<IncrementalBuildDependencyKey>,
	fs: typeof fsMod,
): IncrementalBuildDataDigests {
	return Object.fromEntries(
		Array.from(keys)
			.sort((left, right) => left.localeCompare(right))
			.map((key) => [key, createDataDependencyDigest(settings, key, fs)]),
	);
}

function createDataDependencyDigest(
	settings: AstroSettings,
	key: IncrementalBuildDependencyKey,
	fs: typeof fsMod,
): string | null {
	if (key === CONTENT_STORE_DATA_DEPENDENCY_KEY) {
		return getDataStoreDigest(settings, fs);
	}
	return null;
}

export function createFileDigest(filePath: string, fs: typeof fsMod): string {
	try {
		return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
	} catch {
		return fs.existsSync(filePath) ? 'unreadable' : 'missing';
	}
}

function getDataStoreDigest(
	settings: AstroSettings,
	fs: typeof fsMod = fsMod,
): string | null {
	const dataStoreFile = new URL('./data-store.json', settings.config.cacheDir);
	try {
		if (!fs.existsSync(dataStoreFile)) {
			return null;
		}
		return createHash('sha256').update(fs.readFileSync(dataStoreFile)).digest('hex');
	} catch {
		return fs.existsSync(dataStoreFile) ? 'unreadable' : null;
	}
}

export function getPublicDirDigest(
	settings: AstroSettings,
	fs: typeof fsMod = fsMod,
): string | null {
	try {
		if (!fs.existsSync(settings.config.publicDir)) {
			return null;
		}
		const files = collectDirectoryFiles(settings.config.publicDir, fs);
		const digest = createHash('sha256');
		for (const file of files) {
			digest.update(file);
			digest.update('\0');
			digest.update(
				createHash('sha256')
					.update(fs.readFileSync(new URL(file, appendDirectoryUrl(settings.config.publicDir))))
					.digest('hex'),
			);
			digest.update('\0');
		}
		return digest.digest('hex');
	} catch {
		return fs.existsSync(settings.config.publicDir) ? 'unreadable' : null;
	}
}

export function dependencyDigestsEqual(
	left: IncrementalBuildDependencyDigests,
	right: IncrementalBuildDependencyDigests,
): boolean {
	const leftKeys = Object.keys(left).sort((first, second) => first.localeCompare(second));
	const rightKeys = Object.keys(right).sort((first, second) => first.localeCompare(second));
	return arraysEqual(leftKeys, rightKeys) && leftKeys.every((key) => left[key] === right[key]);
}

export function dataDigestsEqual(
	left: IncrementalBuildDataDigests,
	right: IncrementalBuildDataDigests,
): boolean {
	const leftKeys = Object.keys(left).sort((first, second) => first.localeCompare(second));
	const rightKeys = Object.keys(right).sort((first, second) => first.localeCompare(second));
	return arraysEqual(leftKeys, rightKeys) && leftKeys.every((key) => left[key] === right[key]);
}

function collectDirectoryFiles(directory: URL, fs: typeof fsMod): string[] {
	const rootPath = normalizePath(fileURLToPath(directory)).replace(/\/$/, '');
	return collectDirectoryFilesAt(directory, fs)
		.map((fileUrl) => normalizePath(fileURLToPath(fileUrl)).slice(rootPath.length + 1))
		.sort((left, right) => left.localeCompare(right));
}

function collectDirectoryFilesAt(directory: URL, fs: typeof fsMod): URL[] {
	const entries = fs
		.readdirSync(directory, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));
	return entries.flatMap((entry) => {
		const entryUrl = new URL(entry.name, appendDirectoryUrl(directory));
		if (entry.isSymbolicLink()) {
			return [];
		}
		if (entry.isDirectory()) {
			return collectDirectoryFilesAt(entryUrl, fs);
		}
		return entry.isFile() ? [entryUrl] : [];
	});
}

function toProjectRelativeId(settings: AstroSettings, id: string): string {
	const normalizedRoot = normalizePath(fileURLToPath(settings.config.root)).replace(/\/$/, '');
	return id === normalizedRoot || id.startsWith(`${normalizedRoot}/`)
		? prependForwardSlash(id.slice(normalizedRoot.length))
		: id;
}
