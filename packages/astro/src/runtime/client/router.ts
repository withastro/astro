import micromorph from "micromorph";

if (!customElements.get('route-announcer')) {
  const attrs = {
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    'style': 'position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px'
  }
  customElements.define('route-announcer', class RouteAnnouncer extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      for (const [key, value] of Object.entries(attrs)) {
        this.setAttribute(key, value);
      }
    }
  })
}
let announcer = document.createElement('route-announcer');

const updateRelativeURL = (el: Element, attr: string, base: string | URL) => {
  el.setAttribute(attr, new URL(el.getAttribute(attr)!, base).pathname);
};

function normalizeRelativeURLs(
  el: Element | Document,
  base: string | URL
) {
  el.querySelectorAll('[href^="./"], [href^="../"]').forEach((item) =>
    updateRelativeURL(item, 'href', base)
  );
  el.querySelectorAll('[src^="./"], [src^="../"]').forEach((item) =>
    updateRelativeURL(item, 'src', base)
  );
}
const isElement = (target: EventTarget | null): target is Element => (target as Node)?.nodeType === (target as Node).ELEMENT_NODE;
const isLocalUrl = (href: string) => {
  try {
    const url = new URL(href);
    if (window.location.origin === url.origin) {
      if (url.pathname === window.location.pathname) {
        return !url.hash;
      }
      return true;
    }
  } catch (e) { }
  return false;
};
const getOpts = ({ target }: Event, opts: Options): { url: URL } & Required<Options> | undefined => {
  if (!isElement(target)) return;
  const a = target.closest("a");
  if (!a) return;
  if ('routerIgnore' in a.dataset) return;
  const { href } = a;
  if (!isLocalUrl(href)) return;
  return { url: new URL(href), scroll: 'routerNoscroll' in a.dataset ? false : true, focus: 'routerKeepfocus' in a.dataset ? false : true };
};

let p: DOMParser;
async function setup(doc: Document) {
  for (const island of doc.querySelectorAll('astro-island')) {
    const uid = island.getAttribute('uid');
    const current = document.querySelector<HTMLElement>(`astro-island[uid="${uid}"]`);
    if (current) {
      current.dataset.persist = 'true';
      island.replaceWith(current);
    }
  }
}
async function teardown() {
  for (const island of document.querySelectorAll<HTMLElement>('astro-island')) {
    delete island.dataset.persist;
  }
  window.dispatchEvent(new CustomEvent('astro:hydrate'));
}

async function navigate(url: URL, isBack: boolean = false, opts: Options) {
  p = p || new DOMParser();
  const contents = await fetch(`${url}`)
    .then((res) => res.text())
    .catch(() => {
      window.location.assign(url);
    });
  if (!contents) return;
  if (!isBack) {
    history.pushState({}, "", url);
    if (opts.scroll ?? true) {
      window.scrollTo({ top: 0 });
    }
  }
  const html = p.parseFromString(contents, "text/html");
  normalizeRelativeURLs(html, url);
  await setup(html);
  let title = html.querySelector("title")?.textContent;
  if (title) {
    document.title = title;
  } else {
    const h1 = document.querySelector('h1');
    title = h1?.innerText ?? h1?.textContent ?? url.pathname;
  }
  if (announcer.textContent !== title) {
    announcer.textContent = title;
  }
  announcer.dataset.persist = '';
  html.body.appendChild(announcer);
  if ((document as any).startViewTransition) {
    await (document as any).startViewTransition(() => micromorph(document, html))
  } else {
    await micromorph(document, html);
  }
  if (!document.activeElement?.closest('[data-persist]')) {
    document.body.focus();
  }
  await teardown();
  delete announcer.dataset.persist;
}

interface Options {
  scroll?: boolean;
  focus?: boolean;
}

function createRouter(opts: Options = {}) {
  if (typeof window !== "undefined") {
    window.addEventListener("click", async (event) => {
      const { url, ...options } = getOpts(event, opts) ?? {};
      if (!url) return;
      event.preventDefault();
      try {
        await navigate(url, false, { ...opts, ...options });
      } catch (e) {
        window.location.assign(url);
      }
    });

    window.addEventListener("popstate", () => {
      if (window.location.hash) return;
      try {
        navigate(new URL(window.location.toString()), true, opts);
      } catch (e) {
        window.location.reload();
      }
      return;
    });
  }
  return new class Router {
    go(pathname: string, options?: Partial<Options>) {
      const url = new URL(pathname, window.location.toString())
      return navigate(url, false, { ...opts, ...options })
    }

    back() {
      return window.history.back();
    }

    forward() {
      return window.history.forward();
    }
  }
}

createRouter();
