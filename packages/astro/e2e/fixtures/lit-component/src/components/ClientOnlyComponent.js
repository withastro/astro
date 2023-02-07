import { LitElement, html } from 'lit';

export default class ClientOnlyComponent extends LitElement {
  render() {
    return html`<slot><div class="defaultContent"> Shadow dom default content should not be visible</div></slot><slot name="foo"></slot><slot name="bar"></slot></div>`;
  }
}

customElements.define('client-only-component', ClientOnlyComponent);
