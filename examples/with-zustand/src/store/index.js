import create from 'zustand/vanilla'

const store = create(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 })
}))
const { getState, setState, subscribe, destroy } = store

export {
  getState,
  setState,
  subscribe,
  destroy,
  store
}