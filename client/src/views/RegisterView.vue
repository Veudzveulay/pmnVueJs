<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'participant',
})
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''
  try {
    await authStore.register(form.value)
    router.push('/')
  } catch {
    errorMsg.value = authStore.error
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Inscription</h1>
      <p>Rejoignez EventFlow</p>

      <div v-if="errorMsg" class="form-error" style="text-align: center; margin-bottom: 1rem;">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Nom complet</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Votre nom"
            required
          />
        </div>

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
            placeholder="Min. 6 caractères"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="role">Rôle</label>
          <select id="role" v-model="form.role">
            <option value="participant">Participant</option>
            <option value="organisateur">Organisateur</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? 'Inscription...' : "S'inscrire" }}
        </button>
      </form>

      <div class="auth-link">
        Déjà un compte ? <router-link to="/login">Se connecter</router-link>
      </div>
    </div>
  </div>
</template>
