import { AstroCheck } from '../src/check';
import { DiagnosticSeverity, Range } from 'vscode-languageserver-types';
import ts from 'typescript/lib/tsserverlibrary';
import { pathToUrl } from '../src/utils';
import { expect } from 'chai';
import { join } from 'path';
import { harmonizeNewLines } from './utils';

describe('astro check', async () => {
	it('should check astro projects', async () => {
		const path = join(__dirname, '/fixtures/astro-check/hasError.astro');
		const checker = new AstroCheck(path, require.resolve('typescript/lib/tsserverlibrary.js'));

		checker.upsertDocument({
			uri: pathToUrl(path),
			text: harmonizeNewLines(ts.sys.readFile(path) || ''),
		});

		const diagnostics = await checker.getDiagnostics();
		expect(diagnostics).to.deep.equal([
			{
				diagnostics: [
					{
						code: 2304,
						message: "Cannot find name 'doesntExist'.",
						range: Range.create(1, 1, 1, 12),
						severity: DiagnosticSeverity.Error,
						source: 'ts',
						tags: [],
					},
				],
				fileUri: pathToUrl(path).toString(),
				text: '---\n\tdoesntExist;\n---\n',
			},
		]);
	});
});
