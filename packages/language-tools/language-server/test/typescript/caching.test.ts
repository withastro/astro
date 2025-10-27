import assert from 'node:assert';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
	FileChangeType,
	type FullDocumentDiagnosticReport,
	type MarkupContent,
} from '@volar/language-server';
import { URI } from 'vscode-uri';
import { getLanguageServer, type LanguageServer } from '../server.ts';
import { fixtureDir } from '../utils.ts';

describe('TypeScript - Cache invalidation', async () => {
	let languageServer: LanguageServer;

	async function createFile(name: string, contents: string) {
		const filePath = path.join(fixtureDir, 'caching', name);
		const fileURI = URI.file(filePath).toString();
		await writeFile(filePath, '');
		await languageServer.handle.didChangeWatchedFiles([
			{
				uri: fileURI,
				type: FileChangeType.Created,
			},
		]);
		const openedDocument = await languageServer.handle.openTextDocument(filePath, 'astro');
		await languageServer.handle.updateTextDocument(fileURI, [
			{
				newText: contents,
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 0 },
				},
			},
		]);

		return openedDocument;
	}

	async function removeFile(name: string) {
		const fileURI = URI.file(path.join(fixtureDir, 'caching', name)).toString();
		await rm(path.join(fixtureDir, 'caching', name));
		await languageServer.handle.didChangeWatchedFiles([
			{
				uri: fileURI,
				type: FileChangeType.Deleted,
			},
		]);
	}

	before(async () => {
		languageServer = await getLanguageServer();

		try {
			await mkdir(path.join(fixtureDir, 'caching'));
		} catch {}

		await createFile('toBeDeleted.astro', '');
	});

	it('Can get paths completions for new files', async () => {
		const fileNames = ['PathCompletion.astro', 'PathCompletion2.astro'];

		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'cachingTest.astro'),
			'astro',
		);

		// Try two different files, to make sure the cache capture everything
		for (const fileName of fileNames) {
			await createFile(fileName, '');

			const completions = await languageServer.handle.sendCompletionRequest(document.uri, {
				line: 1,
				character: 33,
			});

			const labels = completions?.items.map((i) => i.label);

			assert.ok(
				labels && labels.includes(fileName),
				`Expected ${fileName} to be in the completions`,
			);
		}
	});

	it('Does not get path completions for removed files', async () => {
		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'cachingTest.astro'),
			'astro',
		);

		await removeFile('toBeDeleted.astro');

		const directoryContent = await readdir(path.join(fixtureDir, '/caching'));
		assert.ok(!directoryContent.includes('toBeDeleted.astro'));

		const completions = await languageServer.handle.sendCompletionRequest(document.uri, {
			line: 1,
			character: 33,
		});

		const labels = completions?.items.map((i) => i.label);

		assert.ok(
			labels && !labels.includes('toBeDeleted.astro'),
			`Expected toBeDeleted.astro to not be in the completions, since the file was deleted`,
		);
	});

	// TODO: Unskip this once the upstream issue is fixed
	it.skip('Can get auto-imports for new files', async () => {
		const fileNames = ['AutoImport.astro', 'AutoImport2.astro'];

		const document = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'cachingTest.astro'),
			'astro',
		);

		// Try two different files in a row, to make sure the cache updates properly for each file individually
		for (const fileName of fileNames) {
			await createFile(fileName, '');

			const imports = await languageServer.handle.sendCompletionRequest(document.uri, {
				line: 4,
				character: 9,
			});

			const labels = imports?.items.map((i) => i.labelDetails?.description);
			const className = fileName.slice(0, -'.astro'.length);
			assert.ok(
				labels && labels.includes(className),
				`Expected ${className} to be in the auto-imports`,
			);
		}
	});

	it('New files have access to context of the project', async () => {
		const existingDocument = await languageServer.handle.openTextDocument(
			path.join(fixtureDir, 'importFromSuperModule.astro'),
			'astro',
		);

		const existingDiagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			existingDocument.uri,
		)) as FullDocumentDiagnosticReport;

		assert.strictEqual(
			existingDiagnostics.items.length,
			0,
			'Expected no diagnostics, as the file is part of the project',
		);

		const document = await createFile(
			'WillImportFromSuperModule.astro',
			'---\n\nimport { hello } from "im-a-super-module";\n\nhello;\n\n---\n',
		);

		const diagnostics = (await languageServer.handle.sendDocumentDiagnosticRequest(
			document.uri,
		)) as FullDocumentDiagnosticReport;

		assert.strictEqual(
			diagnostics.items.length,
			0,
			'Expected no diagnostics, as new files should have access to the module declaration in the project like already existing files.',
		);

		const hoverSuperModule = await languageServer.handle.sendHoverRequest(document.uri, {
			line: 2,
			character: 22,
		});

		assert.ok(
			(hoverSuperModule?.contents as MarkupContent).value.includes('module "im-a-super-module"'),
		);
	});

	after(async () => {
		// Delete all the temp files
		await rm(path.join(fixtureDir, 'caching'), { recursive: true });
	});
});
