<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  try {
    await authStore.login(form.value)
    router.push('/')
  } catch {
    errorMsg.value = authStore.error
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Connexion</h1>
      <p>Bienvenue sur EventFlow</p>

      <div v-if="errorMsg" class="form-error" style="text-align: center; margin-bottom: 1rem;">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Votre mot de passe"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <div class="auth-link">
        Pas de compte ? <router-link to="/register">S'inscrire</router-link>
      </div>
    </div>
  </div>
</template>
