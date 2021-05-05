import { renderMarkdown } from '../compiler/utils.js';

export default function Markdown(_props: any, ...children: string[]): any {
  return children.map(child => {
    const { content } = renderMarkdown(child);
    return content;
  }).join('\n\n')
}
