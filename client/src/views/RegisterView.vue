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
  gdprConsent: false,
})
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''
  if (!form.value.gdprConsent) {
    errorMsg.value = 'Vous devez accepter la politique de confidentialité pour vous inscrire.'
    return
  }
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

        <div class="form-group consent-group">
          <label class="consent-label">
            <input
              type="checkbox"
              v-model="form.gdprConsent"
            />
            <span>
              J'accepte la
              <router-link to="/privacy" target="_blank" class="consent-link">
                politique de confidentialité
              </router-link>
              et le traitement de mes données personnelles.
            </span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="authStore.loading || !form.gdprConsent">
          {{ authStore.loading ? 'Inscription...' : "S'inscrire" }}
        </button>
      </form>

      <div class="auth-link">
        Déjà un compte ? <router-link to="/login">Se connecter</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.consent-group {
  margin-top: 0.5rem;
}

.consent-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--gray);
  cursor: pointer;
}

.consent-label input[type="checkbox"] {
  margin-top: 0.2rem;
  width: auto;
}

.consent-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: underline;
}
</style>
