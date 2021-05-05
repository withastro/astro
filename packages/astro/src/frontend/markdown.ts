import { renderMarkdown } from '../compiler/utils.js';

export default function Markdown(_props: any, ...children: string[]): any {
  const { content } = renderMarkdown(children.join(''));
  return content;
}
