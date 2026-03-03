<script setup>
defineProps({
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="modal-close" @click="emit('close')">&times;</button>
      </div>
      <slot />
    </div>
  </div>
</template>
