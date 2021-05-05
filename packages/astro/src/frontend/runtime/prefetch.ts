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
        }
      });
    }, 1);
  };

/**
 * Fetches a given URL using `<link rel=prefetch>`
 * @param {string} url - the URL to fetch
 * @return {Promise<Event>} a Promise
 */
function addToHead(url: string): Promise<Event> {
  let link: HTMLLinkElement;
  return new Promise((res, rej) => {
    link = document.createElement(`link`);
    link.rel = `prefetch`;
    link.href = url;

    link.onload = res;
    link.onerror = rej;

    document.head.appendChild(link);
  });
}

/**
 * Checks if a Node is an HTMLAnchorElement
 * @param node DOM node to check
 */
function isAnchor(node: Node): node is HTMLAnchorElement {
  return (
    node.nodeType === node.ELEMENT_NODE && (node as Element).tagName === "A"
  );
}

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

/** Observe link visiblity and add listeners to prefetch the URL as needed */
function listen() {
  if (!window.IntersectionObserver) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((_entry) => {
      if (_entry.isIntersecting) {
        const entry = _entry.target as HTMLAnchorElement;
        if (cache.has(entry.href)) return;

        const cb = () => {
          const cleanup = () => {
            for (const event of events) {
              entry.removeEventListener(event, cb);
            }
            listeners.delete(entry);
          };
          prefetch(entry.href)
            ?.then(() => cleanup())
            ?.catch(() => cleanup());
        };
        listeners.set(entry, cb);
        for (const event of events) {
          entry.addEventListener(event, cb, { once: true });
        }
      }
    });
  });

  const mo = new MutationObserver((entries) => {
    entries.forEach((entry) => {
      if (!(entry.addedNodes.length > 0)) {
        return;
      }

      const links = Array.from(entry.addedNodes).filter((node) =>
        isAnchor(node)
      ) as HTMLAnchorElement[];
      if (!(links.length > 0)) return;
      links.forEach((link) => {
        io.observe(link);
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

listen();
