<template>
	<div v-if="mounted" class="single-root-counter">
		<pre>{{ count }}</pre>
		<button @click="count++" class="increment">+</button>
	</div>
	<div v-else class="single-root-loading">loading</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Swapping the root element after mount makes Vue create a fresh root that receives
// the island's fallthrough attributes, including `data-astro-transition-persist`.
const mounted = ref(false);
const count = ref(0);
onMounted(() => (mounted.value = true));
</script>
