<template>
  <div id="nested">
    <Counter />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Counter from './Counter.vue';

export default defineComponent({
  components: { 
    Counter
  }
})
</script>
