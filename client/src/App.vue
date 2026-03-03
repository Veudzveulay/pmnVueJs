<script setup>
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'
import Notification from './components/Notification.vue'

const authStore = useAuthStore()
</script>

<template>
  <div id="app">
    <Navbar v-if="authStore.isAuthenticated" />
    <Notification />
    <router-view />
  </div>
</template>
