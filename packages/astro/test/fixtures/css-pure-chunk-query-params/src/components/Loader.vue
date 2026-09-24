<script setup>
import { defineAsyncComponent } from 'vue';

// Two async components that both import the same CSS file.
// This forces Rollup to create a shared pure CSS chunk for widget.css
// which is then statically imported by both WidgetA and WidgetB chunks.
const WidgetA = defineAsyncComponent(() => import('./WidgetA.vue'));
const WidgetB = defineAsyncComponent(() => import('./WidgetB.vue'));
</script>

<template>
	<WidgetA label="Hello from A" />
	<WidgetB label="Hello from B" />
</template>
