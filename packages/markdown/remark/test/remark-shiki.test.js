import {renderMarkdown} from "../dist/index.js";
import {mockRenderMarkdownParams} from "./test-utils.js";
import chai from "chai";

describe('remark-shiki', () => {
	it('injects language as data attributes in fenced code block', async () => {
		const { code } = await renderMarkdown(
			'```properties\n \
			alpha.beta.gamma=delta\n \
			```',
			mockRenderMarkdownParams
		);

		chai
			.expect(code.trim())
			.to.contain(
			`data-lang="properties"`
		);
	});

	it('injects meta fields as data attributes in fenced code block', async () => {
		const { code } = await renderMarkdown(
			'```properties {1-3,5} insert=[4,6-7] delete="8,10-12" filename="config.properties "\n \
			alpha.beta.gamma=delta\n \
			```',
			mockRenderMarkdownParams
		);

		chai
			.expect(code.trim())
			.to.contain(
				'data-filename="config.properties"'
		)
			.and.to.contain(
			'data-highlight="1-3,5"'
		)
			.and.to.contain(
			'data-insert="4,6-7"'
		).and.to.contain(
			'data-delete="8,10-12"'
		)
		;
	});
});
