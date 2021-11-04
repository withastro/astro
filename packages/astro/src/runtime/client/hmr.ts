if (import.meta.hot) {
  const parser = new DOMParser();
  import.meta.hot.on('astro:reload', async ({ html }: { html: string }) => {
    const { default: morphdom } = await import('morphdom');
    const doc = parser.parseFromString(html, 'text/html');

    morphdom(document.head, doc.head, {
      onBeforeElUpdated(fromEl, toEl) {
        // Do not update identical tags
        if (fromEl.isEqualNode(toEl)) {
          return false;
        }

        // Do not update <link> or <script> tags
        // to avoid re-fetching their contents
        if (fromEl.tagName === toEl.tagName && (toEl.tagName === 'LINK' || toEl.tagName === 'SCRIPT')) {
          return false;
        }

        return true;
      },
    });

    morphdom(document.body, doc.body, {
      onBeforeElUpdated(fromEl, toEl) {
        if (fromEl.localName === 'astro-root') {
          return fromEl.getAttribute('uid') !== toEl.getAttribute('uid');
        }

        if (fromEl.isEqualNode(toEl)) {
          return false;
        }

        return true;
      },
    });
  });
}
