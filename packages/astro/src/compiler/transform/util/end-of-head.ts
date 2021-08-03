import type { TemplateNode } from '@astrojs/parser';

const validHeadElements = new Set(['!doctype', 'title', 'meta', 'link', 'style', 'script', 'noscript', 'base']);

export class EndOfHead {
  private head: TemplateNode | null = null;
  private firstNonHead: TemplateNode | null = null;
  private parent: TemplateNode | null = null;
  private stack: TemplateNode[] = [];

  public append: (...node: TemplateNode[]) => void = () => void 0;

  get found(): boolean {
    return !!(this.head || this.firstNonHead);
  }

  enter(node: TemplateNode) {
    if (this.found) {
      return;
    }

    this.stack.push(node);

    // Fragment has no name
    if (!node.name) {
      return;
    }

    const name = node.name.toLowerCase();

    if (name === 'head') {
      this.head = node;
      this.parent = this.stack[this.stack.length - 2];
      this.append = this.appendToHead;
      return;
    }

    if (!validHeadElements.has(name)) {
      this.firstNonHead = node;
      this.parent = this.stack[this.stack.length - 2];
      this.append = this.prependToFirstNonHead;
      return;
    }
  }

  leave(_node: TemplateNode) {
    this.stack.pop();
  }

  private appendToHead(...nodes: TemplateNode[]) {
    const head = this.head!;
    head.children = head.children ?? [];
    head.children.push(...nodes);
  }

  private prependToFirstNonHead(...nodes: TemplateNode[]) {
    let idx: number = this.parent?.children!.indexOf(this.firstNonHead!) || 0;
    this.parent?.children?.splice(idx, 0, ...nodes);
  }
}
