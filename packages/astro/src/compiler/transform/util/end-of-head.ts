import type { TemplateNode } from '@astrojs/parser';

const beforeHeadElements = new Set(['!doctype', 'html']);
const validHeadElements = new Set(['title', 'meta', 'link', 'style', 'script', 'noscript', 'base']);

export class EndOfHead {
  private html: TemplateNode | null = null;
  private head: TemplateNode | null = null;
  private firstNonHead: TemplateNode | null = null;
  private parent: TemplateNode | null = null;
  private stack: TemplateNode[] = [];

  public foundHeadElements = false;
  public foundBodyElements = false;
  public append: (...node: TemplateNode[]) => void = () => void 0;

  get found(): boolean {
    return !!(this.head || this.firstNonHead);
  }

  get foundHeadContent(): boolean {
    return !!this.head || this.foundHeadElements;
  }

  get foundHeadAndBodyContent(): boolean {
    return this.foundHeadContent && this.foundBodyElements;
  }

  get foundHeadOrHtmlElement(): boolean {
    return !!(this.html || this.head);
  }

  enter(node: TemplateNode) {
    const name = node.name ? node.name.toLowerCase() : null;

    if (this.found) {
      if (!validHeadElements.has(name)) {
        if (node.type === 'Element') {
          this.foundBodyElements = true;
        }
      }
      return;
    }

    this.stack.push(node);

    // Fragment has no name
    if (!node.name) {
      return;
    }

    if (name === 'head') {
      this.head = node;
      this.parent = this.stack[this.stack.length - 2];
      this.append = this.appendToHead;
      return;
    }

    // Skip !doctype and html elements
    if (beforeHeadElements.has(name)) {
      if (name === 'html') {
        this.html = node;
      }
      return;
    }

    if (!validHeadElements.has(name)) {
      if (node.type === 'Element') {
        this.foundBodyElements = true;
      }
      this.firstNonHead = node;
      this.parent = this.stack[this.stack.length - 2];
      this.append = this.prependToFirstNonHead;
      return;
    } else {
      this.foundHeadElements = true;
    }
  }

  leave(_node: TemplateNode) {
    this.stack.pop();
  }

  private appendToHead(...nodes: TemplateNode[]) {
    if (this.head) {
      const head = this.head;
      head.children = head.children ?? [];
      head.children.push(...nodes);
    }
  }

  private prependToFirstNonHead(...nodes: TemplateNode[]) {
    let idx: number = (this.firstNonHead && this.parent?.children?.indexOf(this.firstNonHead)) || 0;
    this.parent?.children?.splice(idx, 0, ...nodes);
  }
}
