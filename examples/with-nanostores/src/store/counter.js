import { createStore, getValue } from 'nanostores';

const counter = createStore(() => {
  counter.set(0);
});

function increaseCounter() {
  counter.set(getValue(counter) + 1);
}

function decreaseCounter() {
  counter.set(getValue(counter) - 1);
}

export { counter, increaseCounter, decreaseCounter };
