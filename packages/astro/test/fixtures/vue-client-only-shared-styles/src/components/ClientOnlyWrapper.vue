<script setup>
import HydratedHeader from './HydratedHeader.vue';
</script>

<template>
	<section class="client-only-wrapper">
		<HydratedHeader />
	</section>
</template>

<style>
	.client-only-wrapper {
		--issue-16119-wrapper: 1;
	}
</style>
