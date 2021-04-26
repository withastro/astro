import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

const options = {
  renderMark: {
    [MARKS.BOLD]: (text) => `<custom-bold>${text}<custom-bold>`,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, next) =>
      `<custom-paragraph>${next(node.content)}</custom-paragraph>`,
  },
};

export function RichTextDocument({ document }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        html: documentToHtmlString(document, options),
      }}
    />
  );
}
