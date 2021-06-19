import diff from 'morphdom';
import { listen } from './prefetch.js';

const defineRouter = () => {
  
  // See https://github.com/catberry/catberry/blob/8.0.3/browser/DocumentRenderer.js#L760-L791
  function isTagImmutable(element: Element) {
    // these 3 kinds of tags once loaded can not be removed
    // otherwise it will cause style or script reloading
    return element.nodeName === 'SCRIPT' || element.nodeName === 'STYLE' || (element.nodeName === 'LINK' && element.getAttribute('rel') === 'stylesheet');
  }

  /**
   * Gets an unique element key using element's attributes and its content.
   * @param {Element} element HTML element.
   * @returns {string} Unique key for the element.
   * @private
   */
  function getElementKey(element: Element) {
    // some immutable elements have several valuable attributes
    // these attributes define the element identity
    const attributes = [];

    switch (element.nodeName) {
      case 'LINK':
        attributes.push(`href=${element.getAttribute('href')}`);
        break;
      case 'SCRIPT':
        attributes.push(`src=${element.getAttribute('src')}`);
        break;
    }

    return `<${element.nodeName} ${attributes.sort().join(' ')}>${element.textContent}</${element.nodeName}>`;
  }

  class AstroRouter extends HTMLElement {
    domParser = new DOMParser();
    cache = new Map();
    isNavigating = false;

    constructor() {
      super();
      this.onClick = this.onClick.bind(this);
      this.transition = this.transition.bind(this);
      this.navigate = this.navigate.bind(this);
    }

    async connectedCallback() {
      window.addEventListener('click', this.onClick);
      window.addEventListener('popstate', this.navigate);
      listen();
    }

    disconnectedCallback() {
      window.removeEventListener('click', this.onClick);
    }

    navigate(event: PopStateEvent) {
      this.transition(window.location.toString());
    }

    /**
     * Merges new and existed head elements and applies only difference.
     * The problem here is that we can't re-create or change script and style tags,
     * because it causes blinking and JavaScript re-initialization. Therefore such
     * element must be immutable in the HEAD.
     * @param {Element} head HEAD DOM element.
     * @param {Element} newHead New HEAD element.
     * @private
     */
    mergeHead(head: HTMLHeadElement, newHead: HTMLHeadElement) {
      if (!newHead) {
        return;
      }

      const headSet = new Set<string>();

      // remove all nodes from the current HEAD except immutable ones
      for (let i = 0; i < head.childNodes.length; i++) {
        const current = head.childNodes[i] as Element;
        if (!isTagImmutable(current)) {
          head.removeChild(current);
          i--;
          continue;
        }
        // we need to collect keys for immutable elements to handle
        // attributes reordering
        headSet.add(getElementKey(current));
      }

      for (let i = 0; i < newHead.childNodes.length; i++) {
        const current = newHead.childNodes[i] as Element;
        if (current.nodeType !== current.ELEMENT_NODE || headSet.has(getElementKey(current))) {
          continue;
        }
        head.appendChild(current);
        // when we append existing child to another parent it removes
        // the node from a previous parent
        i--;
      }
    }

    async transition(href: string | URL, action?: () => void) {
      if (typeof href !== 'string') href = href.toString();
      let html: string;
      if (this.cache.has(href)) {
        html = this.cache.get(href);
      } else {
        html = await fetch(href).then((res) => res.text());
        this.cache.set(href, html);
      }
      const doc = this.domParser.parseFromString(html, 'text/html');
      const root = doc.querySelector('astro-router');

      if (!root) {
        window.location.assign(href);
        return;
      }

      this.isNavigating = true;
      // await exit(this);
      this.mergeHead(document.head, doc.head);
      if (action) action();
      diff(document.body, doc.body, {
        childrenOnly: true,
        onNodeAdded: (node) => {
          if ((node as any).tagName === 'SCRIPT') {
            // Manually recreate the `script` in order to re-execute it
            const newScript = document.createElement('script');
            newScript.type = 'module';
            let text = node.textContent ? document.createTextNode(node.textContent) : null;
            if (text) {
              newScript.appendChild(text);
            }
            node.parentNode?.replaceChild(newScript, node);
            return (false as any);
          }
          return node;
        },
        onBeforeElUpdated: (fromEl, toEl) => {
          if (toEl.tagName === 'script' && fromEl.textContent === toEl.textContent) {
            return false;
          }
          if (toEl.tagName === 'ASTRO-ROOT' && fromEl.getAttribute('uid') === toEl.getAttribute('uid')) {
            return false;
          }
          return !fromEl.isEqualNode(toEl);
        }
      });
      // await enter(this);
      this.isNavigating = false;
    }

    async onClick(event: Event) {
      if (this.isNavigating) {
        event.preventDefault();
        return;
      }
      if ((event.target as HTMLElement).tagName !== 'A') return;
      const a = event.target as HTMLAnchorElement;
      const href = new URL(a.href);
      if (href.origin !== location.origin) return;
      event.preventDefault();
      this.transition(href, () => {
        try {
          history.pushState({ url: a.href }, '', a.href);
          window.scrollTo({ top: 0, left: 0 });
        } catch (error) {
          window.location.assign(a.href);
        }
      });
    }
  }

  customElements.define('astro-router', AstroRouter);
};

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(defineRouter);
} else {
  setTimeout(defineRouter, 200);
}
