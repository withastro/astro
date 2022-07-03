import { createSignal } from "solid-js";
import create from 'solid-zustand'
import { store } from '../store';

export default function SolidCounter() {
  const useStore = create(store);
  const state = useStore();

  return (
    <div id="solid" class="counter">
      <button onClick={state.increasePopulation}>one up</button>
      <h1>{state.bears} around here ...</h1>
    </div>
  );
}
