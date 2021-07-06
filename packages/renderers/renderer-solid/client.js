import { render, createComponent } from 'solid-js/web';

export default (element) => (Component, props, children) => {
  return render(() => createComponent(Component, props), element);
}
