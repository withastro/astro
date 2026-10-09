<script setup>
import '../styles/widget.css';
defineProps({ label: String });
</script>

<template>
	<div class="widget">B: {{ label }}</div>
</template>
