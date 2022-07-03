import { useState } from 'preact/hooks';
import create from 'zustand';
import { store } from '../store';

export default function PreactCounter() {
  const useStore = create(store);
  const bears = useStore(state => state.bears);
  const increasePopulation = useStore(state => state.increasePopulation);

  return (
    <div id="preact" className="counter">
      <button onClick={increasePopulation}>one up</button>
      <h1>{bears} around here ...</h1>
    </div>
  );
}
