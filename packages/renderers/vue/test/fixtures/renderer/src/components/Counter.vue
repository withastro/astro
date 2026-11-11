<script setup>
import { ref } from 'vue';

const props = defineProps({ start: Number });
const count = ref(props.start);
</script>

<template>
	<button @click="count++">count: {{ count }}</button>
	<Greeting />
</template>
