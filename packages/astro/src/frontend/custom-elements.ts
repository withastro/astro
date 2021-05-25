class AstroFragment extends HTMLElement {
  fragment: DocumentFragment;
  constructor() {
    super();
    this.fragment = document.createDocumentFragment();
  }

  set mounted(value: boolean) {
    if (value) {
      this.fragment.append(...this.childNodes);
      this.parentNode?.replaceChild(this.fragment, this);
    }
  }
}

customElements.define('astro-fragment', AstroFragment);
