// Aha! These are not analytics at all!
class KonamiCode {
  enabled = false;
  keys = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  accepted = [...new Set(this.keys)];
  inputs = [];

  constructor({ enable, disable }) {
    this.enable = enable;
    this.disable = disable;
    this.handleKey = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
  }

  handleKey({ key }) {
    if (this.enabled) {
      this.reset();
      return;
    }
    if (!this.accepted.includes(key)) return;

    if (this.keys[this.inputs.length] === key) {
      this.handleInput(key)
    } else {
      this.reset();
    }
  }

  handleInput(key) {
    this.inputs.push(key);

    if (this.inputs.length === 10) {
      this.handleMatch();
    }
  }

  handleMatch() {
    this.enabled = true;
    this.enable();
    this.inputs = [];
  }

  reset() {
    if (this.enabled) {
      this.enabled = false;
      this.disable();
    }
    if (this.inputs.length) {
      this.inputs = [];
    }
  }
}

export function init() {
  new KonamiCode({
    enable: () => document.body.classList.add('🥚'),
    disable: () => document.body.classList.remove('🥚'),
  });
}
