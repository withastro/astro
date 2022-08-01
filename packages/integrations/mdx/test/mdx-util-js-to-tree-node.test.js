import { jsToTreeNode } from '@astrojs/mdx/utils';
import { compile } from '@mdx-js/mdx';
import { expect } from 'chai';
import { parse as parseESM } from 'es-module-lexer';
import { rehypeReadingTime } from './test-utils.js'

const sampleMdx = `# I'm MDX!`

describe('jsToTreeNode', () => {
	it('handles basic JS injection', async () => {
		const js = `console.log('working')`
		function injectConsoleLog() {
			return function (tree) {
				tree.children.unshift(
					jsToTreeNode(js)
				)
			};
		}

		const compiled = await compile(sampleMdx, {
			rehypePlugins: [injectConsoleLog],
		})

		expect(String(compiled.value)).to.contain(js)
	})

	it('handles export injection', async () => {
		function injectExport() {
			return function (tree) {
				tree.children.unshift(
					jsToTreeNode(`export const working = true`)
				)
			};
		}

		const compiled = await compile(sampleMdx, {
			rehypePlugins: [injectExport],
		})

		const [, moduleExports] = parseESM(compiled.value)
		expect(moduleExports).to.contain('working')
	})

	it('handles readingTime example', async () => {
		const compiled = await compile(sampleMdx, {
			rehypePlugins: [rehypeReadingTime],
		})

		const [, moduleExports] = parseESM(compiled.value)
		expect(moduleExports).to.contain('readingTime')
		expect(String(compiled.value)).to.match(/\d+ min read/)
	})
})
