<script setup lang="ts">
// A component with strictly typed props
defineProps<{
  message: string;
}>();
</script>

<template>
  <div>{{ message }}</div>
</template>
