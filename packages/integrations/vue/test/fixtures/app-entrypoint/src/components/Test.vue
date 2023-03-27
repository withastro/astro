<script setup lang="ts">
import {onMounted, ref} from 'vue'
/** The top-level await causes event handling to not work (button click) */
await new Promise((resolve) => setTimeout(resolve, 10));

const a = ref(1);

onMounted(()=>{
  a.value = 2
})

</script>

<template>
  <div id="test">
   {{ a }}
  </div>
</template>
