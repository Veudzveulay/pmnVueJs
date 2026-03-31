<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="navbar-brand">EventFlow</router-link>

      <div class="navbar-links">
        <router-link to="/">Dashboard</router-link>
        <router-link to="/calendar">Calendrier</router-link>
        <router-link to="/map">Carte</router-link>

        <router-link
          v-if="authStore.isOrganisateur || authStore.isAdmin"
          to="/events/create"
        >
          Créer un événement
        </router-link>

        <router-link v-if="authStore.isAdmin" to="/admin">
          Administration
        </router-link>

        <router-link to="/my-data">
          Mes données
        </router-link>

        <div class="navbar-user">
          <span>{{ authStore.user?.name }}</span>
          <span class="navbar-role">{{ authStore.user?.role }}</span>
          <button class="btn btn-sm btn-outline" @click="handleLogout">
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
