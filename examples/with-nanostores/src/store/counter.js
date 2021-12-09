import { atom } from 'nanostores';

const counter = atom(0);

function increaseCounter() {
  counter.set(counter.get() + 1);
}

function decreaseCounter() {
  counter.set(counter.get() - 1);
}

export { counter, increaseCounter, decreaseCounter };
