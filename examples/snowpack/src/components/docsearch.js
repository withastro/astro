import docsearch from 'docsearch.js/dist/cdn/docsearch.min.js';

customElements.define(
  'doc-search',
  class extends HTMLElement {
    connectedCallback() {
      if (!this._setup) {
        const apiKey = this.getAttribute('api-key');
        const selector = this.getAttribute('selector');
        docsearch({
          apiKey: apiKey,
          indexName: 'snowpack',
          inputSelector: selector,
          debug: true, // Set debug to true if you want to inspect the dropdown
        });
        this._setup = true;
      }
    }
  },
);
