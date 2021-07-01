
globalThis.customElements = {
  _elements: new Map(),
  define(name, ctr) {
    ctr.tagName = name;
    this._elements.set(name, ctr);
  },
  get(name) {
    return this._elements.get(name);
  }
};

globalThis.HTMLElement = class {
  attachShadow() {
    this.shadowRoot = new HTMLElement();
  }

  get localName() {
    return this.constructor.tagName;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
  }
};