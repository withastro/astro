<template>
  <div id="vue" class="counter">
      <button @click="increasePopulation">one up</button>
      <h1>{{ bears }} around here ...</h1>
  </div>
</template>

<script>
import create from 'vue-zustand'
import { store } from '../store';

export default {
  setup() {
    const useStore = create(store);
    const { bears, increasePopulation } = useStore();

    return {
      bears,
      increasePopulation
    }
  }
}
</script>
