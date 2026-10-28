<script setup>
import { ref } from 'vue';

defineProps({ id: String });
const count = ref(0);
</script>

<template>
	<button :id="id" @click="count++">vue {{ count }}</button>
</template>
