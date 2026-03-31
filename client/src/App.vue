<script setup>
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'
import CookieBanner from './components/CookieBanner.vue'

const authStore = useAuthStore()
</script>

<template>
  <div id="app">
    <Navbar v-if="authStore.isAuthenticated" />
    <router-view />
    <CookieBanner />
  </div>
</template>
