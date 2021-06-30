<template>
  <div id="counter">{{ count }}</div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0);
    const add = () => count.value++;
    const subtract = () => count.value--;

    return {
      count,
      add,
      subtract
    }
  }
})
</script>
