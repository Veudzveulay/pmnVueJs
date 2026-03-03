<script setup>
import { ref } from 'vue'

const notifications = ref([])
let nextId = 0

function addNotification(message, type = 'success') {
  const id = nextId++
  notifications.value.push({ id, message, type })
  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }, 3000)
}

// Exposer la fonction globalement
defineExpose({ addNotification })
</script>

<template>
  <div>
    <div
      v-for="notif in notifications"
      :key="notif.id"
      :class="['notification', `notification-${notif.type}`]"
    >
      {{ notif.message }}
    </div>
  </div>
</template>
