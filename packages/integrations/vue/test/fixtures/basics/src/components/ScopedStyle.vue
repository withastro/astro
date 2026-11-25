<script setup>
const width = '100px';
</script>

<template>
	<div class="box">Scoped</div>
</template>

<style scoped>
.box {
	color: red;
	width: v-bind(width);
}
</style>
