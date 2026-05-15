import { existsSync, promises as fs } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pLimit from 'p-limit';
import colors from 'piccolore';
import picomatch from 'picomatch';
import { glob as tinyglobby } from 'tinyglobby';
import { getContentEntryIdAndSlug, posixRelative } from '../utils.js';
function generateIdDefault({ entry, base, data }, isLegacy) {
	if (data.slug) {
		return data.slug;
	}
	const entryURL = new URL(encodeURI(entry), base);
	if (isLegacy) {
		const { id } = getContentEntryIdAndSlug({
			entry: entryURL,
			contentDir: base,
			collection: '',
		});
		return id;
	}
	const { slug } = getContentEntryIdAndSlug({
		entry: entryURL,
		contentDir: base,
		collection: '',
	});
	return slug;
}
function checkPrefix(pattern, prefix) {
	if (Array.isArray(pattern)) {
		return pattern.some((p) => p.startsWith(prefix));
	}
	return pattern.startsWith(prefix);
}
const secretLegacyFlag = /* @__PURE__ */ Symbol('astro.legacy-glob');
function glob(globOptions) {
	if (checkPrefix(globOptions.pattern, '../')) {
		throw new Error(
			'Glob patterns cannot start with `../`. Set the `base` option to a parent directory instead.',
		);
	}
	if (checkPrefix(globOptions.pattern, '/')) {
		throw new Error(
			'Glob patterns cannot start with `/`. Set the `base` option to a parent directory or use a relative path instead.',
		);
	}
	const isLegacy = !!globOptions[secretLegacyFlag];
	const generateId = globOptions?.generateId ?? ((opts) => generateIdDefault(opts, isLegacy));
	const fileToIdMap = /* @__PURE__ */ new Map();
	return {
		name: 'glob-loader',
		load: async ({
			config,
			collection,
			logger,
			watcher,
			parseData,
			store,
			generateDigest,
			entryTypes,
		}) => {
			const renderFunctionByContentType = /* @__PURE__ */ new WeakMap();
			const untouchedEntries = new Set(store.keys());
			async function syncData(entry, base, entryType, oldId) {
				if (!entryType) {
					logger.warn(`No entry type found for ${entry}`);
					return;
				}
				const fileUrl = new URL(encodeURI(entry), base);
				const contents = await fs.readFile(fileUrl, 'utf-8').catch((err) => {
					logger.error(`Error reading ${entry}: ${err.message}`);
					return;
				});
				if (!contents && contents !== '') {
					logger.warn(`No contents found for ${entry}`);
					return;
				}
				const { body, data } = await entryType.getEntryInfo({
					contents,
					fileUrl,
				});
				const id = generateId({ entry, base, data });
				if (oldId && oldId !== id) {
					store.delete(oldId);
				}
				untouchedEntries.delete(id);
				const existingEntry = store.get(id);
				const digest = generateDigest(contents);
				const filePath2 = fileURLToPath(fileUrl);
				if (existingEntry && existingEntry.digest === digest && existingEntry.filePath) {
					if (existingEntry.deferredRender) {
						store.addModuleImport(existingEntry.filePath);
					}
					if (existingEntry.assetImports?.length) {
						store.addAssetImports(existingEntry.assetImports, existingEntry.filePath);
					}
					fileToIdMap.set(filePath2, id);
					return;
				}
				const relativePath2 = posixRelative(fileURLToPath(config.root), filePath2);
				const parsedData = await parseData({
					id,
					data,
					filePath: filePath2,
				});
				if (existingEntry && existingEntry.filePath && existingEntry.filePath !== relativePath2) {
					const oldFilePath = new URL(existingEntry.filePath, config.root);
					if (existsSync(oldFilePath)) {
						logger.warn(
							`Duplicate id "${id}" found in ${filePath2}. Later items with the same id will overwrite earlier ones.`,
						);
					}
				}
				if (entryType.getRenderFunction) {
					let render = renderFunctionByContentType.get(entryType);
					if (!render) {
						render = await entryType.getRenderFunction(config);
						renderFunctionByContentType.set(entryType, render);
					}
					let rendered = void 0;
					try {
						rendered = await render?.({
							id,
							data,
							body,
							filePath: filePath2,
							digest,
						});
					} catch (error) {
						logger.error(`Error rendering ${entry}: ${error.message}`);
					}
					store.set({
						id,
						data: parsedData,
						body: globOptions.retainBody === false ? void 0 : body,
						filePath: relativePath2,
						digest,
						rendered,
						assetImports: rendered?.metadata?.imagePaths,
					});
				} else if ('contentModuleTypes' in entryType) {
					store.set({
						id,
						data: parsedData,
						body: globOptions.retainBody === false ? void 0 : body,
						filePath: relativePath2,
						digest,
						deferredRender: true,
					});
				} else {
					store.set({
						id,
						data: parsedData,
						body: globOptions.retainBody === false ? void 0 : body,
						filePath: relativePath2,
						digest,
					});
				}
				fileToIdMap.set(filePath2, id);
			}
			let baseDir;
			if (isLegacy && !globOptions.base) {
				baseDir = new URL(`./src/content/${collection}`, config.root);
			} else {
				baseDir = globOptions.base ? new URL(globOptions.base, config.root) : config.root;
			}
			if (!baseDir.pathname.endsWith('/')) {
				baseDir.pathname = `${baseDir.pathname}/`;
			}
			const filePath = fileURLToPath(baseDir);
			const relativePath = relative(fileURLToPath(config.root), filePath);
			const exists = existsSync(baseDir);
			if (!exists) {
				logger.warn(`The base directory "${fileURLToPath(baseDir)}" does not exist.`);
			}
			const files = await tinyglobby(globOptions.pattern, {
				cwd: fileURLToPath(baseDir),
				expandDirectories: false,
			});
			if (exists && files.length === 0) {
				logger.warn(
					`No files found matching "${globOptions.pattern}" in directory "${relativePath}"`,
				);
				return;
			}
			function configForFile(file) {
				const ext = file.split('.').at(-1);
				if (!ext) {
					logger.warn(`No extension found for ${file}`);
					return;
				}
				return entryTypes.get(`.${ext}`);
			}
			const limit = pLimit(10);
			const skippedFiles = [];
			const contentDir = new URL('content/', config.srcDir);
			const configFiles = new Set(
				['config.js', 'config.ts', 'config.mjs'].map((file) => new URL(file, contentDir).href),
			);
			function isConfigFile(file) {
				const fileUrl = new URL(file, baseDir);
				return configFiles.has(fileUrl.href);
			}
			await Promise.all(
				files.map((entry) => {
					if (isConfigFile(entry)) {
						return;
					}
					return limit(async () => {
						const entryType = configForFile(entry);
						await syncData(entry, baseDir, entryType);
					});
				}),
			);
			const skipCount = skippedFiles.length;
			if (skipCount > 0) {
				const patternList = Array.isArray(globOptions.pattern)
					? globOptions.pattern.join(', ')
					: globOptions.pattern;
				logger.warn(
					`The glob() loader cannot be used for files in ${colors.bold('src/content')} when legacy mode is enabled.`,
				);
				if (skipCount > 10) {
					logger.warn(
						`Skipped ${colors.green(skippedFiles.length)} files that matched ${colors.green(patternList)}.`,
					);
				} else {
					logger.warn(`Skipped the following files that matched ${colors.green(patternList)}:`);
					skippedFiles.forEach((file) => logger.warn(`\u2022 ${colors.green(file)}`));
				}
			}
			untouchedEntries.forEach((id) => store.delete(id));
			if (!watcher) {
				return;
			}
			watcher.add(filePath);
			const matchesGlob = (entry) =>
				!entry.startsWith('../') && picomatch.isMatch(entry, globOptions.pattern);
			const basePath = fileURLToPath(baseDir);
			async function onChange(changedPath) {
				const entry = posixRelative(basePath, changedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const entryType = configForFile(changedPath);
				const baseUrl = pathToFileURL(basePath);
				const oldId = fileToIdMap.get(changedPath);
				try {
					await syncData(entry, baseUrl, entryType, oldId);
					logger.info(`Reloaded data from ${colors.green(entry)}`);
				} catch (e) {
					logger.error(`Failed to reload ${entry}: ${e.message}`);
				}
			}
			watcher.on('change', onChange);
			watcher.on('add', onChange);
			watcher.on('unlink', async (deletedPath) => {
				const entry = posixRelative(basePath, deletedPath);
				if (!matchesGlob(entry)) {
					return;
				}
				const id = fileToIdMap.get(deletedPath);
				if (id) {
					store.delete(id);
					fileToIdMap.delete(deletedPath);
				}
			});
		},
	};
}
export { glob, secretLegacyFlag };
