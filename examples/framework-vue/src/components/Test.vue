<template>
	<div>Hello world!</div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'

export default defineComponent({
	setup() {
		onMounted(() => {
			console.log("Hello world!")
		})
	},
})
</script>
