function onHashChange() {
    document.querySelector(`${window.location.hash}`).scrollIntoView({ block: 'start', behavior: 'smooth' });
}
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        onHashChange();
    }
})
window.addEventListener('hashchange', (event) => {
    event.preventDefault();
    onHashChange()
})

const isElement = (target: EventTarget): target is Element => target instanceof Element;
const isLocalUrl = (href: string) => {
    try {
        const url = new URL(href);
        if (window.location.origin === url.origin) {
            if (url.pathname === window.location.pathname) {
                return !url.hash;
            }
            return true;
        }
    } catch (e) {}
    return false;
}
const isRelativeHref = (href: string) => {
    return href[0] === '.' || !(href.startsWith('http') || href.startsWith('/'));
}
const getUrl = ({ target }: Event): URL|undefined => {
    if (!isElement(target)) return;
    const a = target.closest('a');
    if (!a) return;
    const { href } = a;
    if (!isLocalUrl(href)) return;
    return new URL(href);
}

const cache = new Map<string, string>();
if (window.matchMedia('(hover: hover)').matches) {
    let activeUrl: URL;
    let activeTimeout: any;
    const set = (url: URL) => {
        if (cache.has(url.toString())) return;
        activeUrl = url;
        activeTimeout = setTimeout(() => {
            fetch(url.toString()).then((res) => res.text()).then(text => cache.set(url.toString(), text));
        }, 600);
    }
    const clear = () => {
        if (activeTimeout) {
            clearTimeout(activeTimeout);
            activeUrl = null;
            activeTimeout = null;
        }
    }
    window.addEventListener('mousemove', (event) => {
        const url = getUrl(event);
        if (!url) return clear();
        if (!activeUrl || url.toString() === activeUrl.toString()) {
            if (activeTimeout) return;
            return set(url);
        }
    })
}

const p = new DOMParser();
window.addEventListener('click', async (event) => {
    const url = getUrl(event);
    if (!url) return;
    event.preventDefault();
    try {
        navigate(url);
    } catch (e) {
        window.location.assign(url);
    }
})
window.addEventListener('popstate', () => {
    if (window.location.hash) return true;
    try {
        navigate(new URL(window.location.toString()), true);
    } catch (e) {
        window.location.reload();
    }
    return true;
})

async function navigate(url: URL, isBack: boolean = false) {
    if (!isBack) {
        history.pushState({}, '', url);
    }
    await document.querySelector('#root').animate({ opacity: 0 }, { duration: 120, easing: 'ease-out' }).finished;
    document.documentElement.classList.add('transition');
    if (!isBack) {
        window.scrollTo({ top: 0 })
    }
    let contents = cache.get(`${url}`) || await fetch(`${url}`)
        .then(res => res.text())
        .catch(() => {
            window.location.assign(url);
        });
    if (!contents) return;
    const html = p.parseFromString(contents, 'text/html');
    if (document.body.classList.contains('🥚')) {
        html.body.classList.add('🥚');
    }
    html.body.classList.add('js');
    html.documentElement.classList.add('transition');
    await diff(document, html, new URL(window.location.toString()), url);
    await document.querySelector('#root').animate({ opacity: 1 }, { duration: 80, easing: 'ease-in' }).finished;
    document.documentElement.classList.remove('transition');
    window.dispatchEvent(new CustomEvent('astro:navchange'));
}

function waitForLoad(elements: HTMLElement[]): Promise<void> {
    return new Promise((resolve) => {
        const styles = elements.filter(el => el.localName === 'link' && el.hasAttribute('href') && el.getAttribute('rel') === 'stylesheet');
        const max = styles.length;
        let count = 0;
        if (max === 0) {
            resolve();
        }

        styles.forEach(link => {
            link.addEventListener('load', () => {
                count++;
                if (count >= max) {
                    resolve();
                }
            }, { once: true });
        })
    })
}

const s = new XMLSerializer();
async function diff(a: Document, b: Document, aURL: URL, bURL: URL) {
    const keys = new Map();
    const remove = new Map();
    const add = new Map();
    const duplicates = new Set<string>();

    function sync(from: Element, to: Element) {
        for (const attr of to.attributes) {
            let { namespaceURI, name, value } = attr;
            if (namespaceURI) {
                name = attr.localName || name;
                const oldValue = from.getAttributeNS(namespaceURI, name);
                if (oldValue !== value) {
                    if (attr.prefix === 'xmlns'){
                        name = attr.name;
                    }
                    from.setAttributeNS(namespaceURI, name, value);
                }
            } else {
                const oldValue = from.getAttribute(name);
                if (oldValue !== value) {
                    from.setAttribute(name, value);
                }
            }
        }
        for (const attr of from.attributes) {
            let { namespaceURI, name } = attr; 
            if (namespaceURI) {
                name = attr.localName || name;
                if (!to.hasAttributeNS(namespaceURI, name)) {
                    from.removeAttributeNS(namespaceURI, name)
                }
            } else {
                if (!to.hasAttribute(name)) {
                    from.removeAttribute(name);
                }
            }
        }

        if (from.localName === 'title') {
            from.textContent = to.textContent;
        }
    }

    // Head logic
    function getHeadKey(node: Element) {
        switch (node.localName) {
            case 'title': return 'title';
            case 'meta': {
                if (node.hasAttribute('name')) {
                    return `meta[name=${node.getAttribute('name')}]`;
                }
                if (node.hasAttribute('property')) {
                    return `meta[property=${node.getAttribute('property')}]`;
                }
                return;
            }
        }
    }

    for (const child of a.head.children) {
        let key = getHeadKey(child);
        if (key) {
            keys.set(key, child);
            continue;
        }
        if (child.localName === 'script' && child.hasAttribute('src')) {
            const src = child.getAttribute('src');
            if (isRelativeHref(src)) {
                const absURL = new URL(src, aURL);
                key = `script[src=${absURL.pathname}]`;
                child.setAttribute('src', absURL.pathname);
            } else {
                key = `script[src=${src}]`
            }
        } else if (child.localName === 'link' && child.hasAttribute('href')) {
            const href = child.getAttribute('href');
            const rel = child.getAttribute('rel');
            if (isRelativeHref(href)) {
                const absURL = new URL(href, aURL);
                key = `link[rel=${rel}][href=${absURL.pathname}]`;
                child.setAttribute('href', absURL.pathname);
            } else {
                key = `link[rel=${rel}][href=${href}]`
            }
        } else {
            key = s.serializeToString(child);
        }

        
        remove.set(key, child);
    }

    for (const child of b.head.children) {
        let key = getHeadKey(child);
        if (key) {
            sync(keys.get(key), child);
            continue;
        }
        if (child.localName === 'script' && child.hasAttribute('src')) {
            const src = child.getAttribute('src');
            if (isRelativeHref(src)) {
                const absURL = new URL(src, bURL);
                key = `script[src=${absURL.pathname}]`;
                child.setAttribute('src', absURL.pathname);
            } else {
                key = `script[src=${src}]`
            }
        } else if (child.localName === 'link' && child.hasAttribute('href')) {
            const href = child.getAttribute('href');
            const rel = child.getAttribute('rel');
            if (isRelativeHref(href)) {
                const absURL = new URL(href, bURL);
                key = `link[rel=${rel}][href=${absURL.pathname}]`;
                child.setAttribute('href', absURL.pathname);
            } else {
                key = `link[rel=${rel}][href=${href}]`
            }
        } else {
            key = s.serializeToString(child);
        }
        
        if (remove.has(key)) {
            remove.delete(key);
            duplicates.add(key);
        } else if (!duplicates.has(key) && !add.has(key)) {
            add.set(key, child);
        }
    }

    for (const node of remove.values()) {
        node.remove();
    }
    for (const node of add.values()) {
        a.head.appendChild(node);
    }
    // Sync attributes
    for (const el of ['documentElement', 'head', 'body']) {
        sync(a[el], b[el]);
    }
    await waitForLoad(Array.from(add.values()));


    // Body
    const oldBody = new Map<string, Element>();
    const newBody = new Set<Element>();
    for (const child of a.body.children) {
        let key: string;
        if (child.localName === 'script' && child.hasAttribute('src')) {
            const src = child.getAttribute('src');
            if (isRelativeHref(src)) {
                const absURL = new URL(src, bURL);
                key = `script[src=${absURL.pathname}]`;
                child.setAttribute('src', absURL.pathname);
            } else {
                key = `script[src=${src}]`
            }
        } else {
            key = s.serializeToString(child);
        }
        oldBody.set(key, child);
    }

    outer: for (const child of b.body.children) {
        let key: string;
        if (child.localName === 'script' && child.hasAttribute('src')) {
            const src = child.getAttribute('src');
            if (isRelativeHref(src)) {
                const absURL = new URL(src, bURL);
                key = `script[src=${absURL.pathname}]`;
                child.setAttribute('src', absURL.pathname);
            } else {
                key = `script[src=${src}]`
            }
        } else {
            key = s.serializeToString(child);
        }

        if (oldBody.has(key)) {
            oldBody.delete(key);
            continue outer;
        }

        for (const [oldKey, oldChild] of oldBody.entries()) {
            if (oldChild.localName === child.localName) {
                sync(oldChild, child);
                oldChild.replaceChildren(...child.children);
                oldBody.delete(oldKey);
                continue outer;
            }
        }
        newBody.add(child);
    }
    for (const node of oldBody.values()) {
        node.remove();
    }
    for (const node of newBody.values()) {
        a.body.appendChild(node);
    }
}
