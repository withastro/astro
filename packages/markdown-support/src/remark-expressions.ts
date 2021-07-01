import {mdxExpression} from 'micromark-extension-mdx-expression'
import {mdxExpressionFromMarkdown, mdxExpressionToMarkdown} from 'mdast-util-mdx-expression'

function remarkExpressions(this: any, options: any) {
  let settings = options || {}
  let data = this.data()

  add('micromarkExtensions', mdxExpression({}))
  add('fromMarkdownExtensions', mdxExpressionFromMarkdown)
  add('toMarkdownExtensions', mdxExpressionToMarkdown)

  function add(field: any, value: any) {
    /* istanbul ignore if - other extensions. */
    if (data[field]) data[field].push(value)
    else data[field] = [value]
  }
}

export default remarkExpressions;
