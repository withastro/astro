<template>
  <div>
    <h2 class="mt-2 mb-8 text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">Old Photos from Ute Valley Park</h2>
    <div class="grid md:grid-cols-3 gap-3">
      <img class="image" src="/images/old-ute-valley-park-photos/old-ute-1.jpg" />      
    </div>
    <div v-if="!viewMore">
      <button class="text-base my-2 ml-1 text-green-900 rounded px-2 py-1 underline" @click="viewMore = true">
        View More
      </button>
    </div>
    <div v-else>
      <div class="grid md:grid-cols-3 gap-3 mt-3">
        <img class="image" src="/images/old-ute-valley-park-photos/old-ute-1.jpg" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const viewMore = ref(false);
</script>
