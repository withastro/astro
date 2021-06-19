/** Observe link visiblity and add listeners to prefetch the URL as needed */
export function listen() {
  if (typeof window === "undefined") return;

  // Cache of URLs we've already prefetched
  const cache = new Set();
  const listeners = new Map<HTMLAnchorElement, (...args: any) => any>();
  const events = ["focus", "pointerenter"];

  // RIC and shim for browsers setTimeout() without it
  const requestIdleCallback =
    (window as any).requestIdleCallback ||
    function (cb: (...args: any) => any) {
      const start = Date.now();
      return setTimeout(function () {
        cb({
          didTimeout: false,
          timeRemaining: function () {
            return Math.max(0, 50 - (Date.now() - start));
          },
        });
      }, 1);
    };

  /** prefecth a given URL */
  function prefetch(url: string) {
    const conn = (window.navigator as any).connection;
    if (conn) {
      // Don't prefetch if using 2G or if Save-Data is enabled.
      if (conn.saveData || /2g/.test(conn.effectiveType)) {
        return;
      }
    }

    if (!cache.has(url)) {
      cache.add(url);
      return addToHead(new URL(url, window.location.href).toString());
    }
  }

  /**
   * Checks if a Node is an HTMLElement
   * @param node DOM node to check
   */
  function isElement(node: Node): node is HTMLElement {
    return node.nodeType === node.ELEMENT_NODE;
  }

  /**
   * Fetches a given URL using `<link rel=prefetch>`
   * @param {string} url - the URL to fetch
   * @return {Promise<Event>} a Promise
   */
  function addToHead(url: string): Promise<Event> {
    let link: HTMLLinkElement;
    return new Promise((res, rej) => {
      link = document.createElement(`link`);
      link.setAttribute("astro-prefetch", "");
      link.rel = `prefetch`;
      link.href = url;

      link.onload = res;
      link.onerror = rej;

      document.head.appendChild(link);
    });
  }

  let usesPointer = false;
  const hoverMedia = matchMedia("(hover: hover)");
  usesPointer = hoverMedia.matches;
  hoverMedia.addEventListener("change", ({ matches }) => {
    usesPointer = matches;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((_entry) => {
      if (_entry.isIntersecting) {
        const entry = _entry.target as HTMLAnchorElement;
        if (cache.has(entry.href)) return;
        const cleanup = () => {
          if (!listeners.has(entry)) return;
          for (const event of events) {
            entry.removeEventListener(event, cb);
          }
          listeners.delete(entry);
        };
        const cb = () => {
          prefetch(entry.href)?.finally(() => cleanup());
        };

        if (!usesPointer) {
          cb();
        } else {
          listeners.set(entry, cleanup);
          for (const event of events) {
            entry.addEventListener(event, cb, { once: true });
          }
        }
      }
    });
  });

  const mo = new MutationObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.addedNodes.length === 0 && entry.removedNodes.length === 0) {
        return;
      }
      // Listen for any new links
      const links: HTMLAnchorElement[] = [];
      Array.from(entry.addedNodes).forEach((el) => {
        if (isElement(el)) {
          links.push(...Array.from(el.querySelectorAll("a")).filter(a => new URL(a.href).origin === location.origin));
        }
      });
      if (links.length === 0) return;
      links.forEach((link) => {
        io.observe(link);
      });

      // Cleanup any old links
      Array.from(entry.removedNodes).forEach((el) => {
        if (isElement(el)) {
          Array.from(el.querySelectorAll("a")).filter(a => new URL(a.href).origin === location.origin).forEach((a) => {
            if (listeners.has(a)) {
              listeners.get(a)?.();
            }
          });
        }
      });
    });
  });

  requestIdleCallback(() => {
    mo.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll("a").forEach((link) => {
      io.observe(link);
    });
  });
}
