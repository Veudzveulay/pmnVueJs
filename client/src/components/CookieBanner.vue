<script setup>
import { ref, onMounted } from 'vue'

const showBanner = ref(false)
const showDetails = ref(false)

const preferences = ref({
  necessary: true,     // Toujours activé
  analytics: false,
  marketing: false,
})

onMounted(() => {
  const saved = localStorage.getItem('cookie-consent')
  if (!saved) {
    showBanner.value = true
  }
})

function acceptAll() {
  preferences.value.analytics = true
  preferences.value.marketing = true
  savePreferences()
}

function rejectAll() {
  preferences.value.analytics = false
  preferences.value.marketing = false
  savePreferences()
}

function savePreferences() {
  const consent = {
    necessary: true,
    analytics: preferences.value.analytics,
    marketing: preferences.value.marketing,
    date: new Date().toISOString(),
    version: '1.0',
  }
  localStorage.setItem('cookie-consent', JSON.stringify(consent))
  showBanner.value = false
}
</script>

<template>
  <div v-if="showBanner" class="cookie-banner">
    <div class="cookie-banner-content">
      <div class="cookie-banner-text">
        <h3>Gestion des cookies</h3>
        <p>
          Nous utilisons des cookies pour améliorer votre expérience sur EventFlow.
          Vous pouvez choisir les catégories de cookies que vous acceptez.
          <router-link to="/privacy" class="cookie-link">Politique de confidentialité</router-link>
        </p>
      </div>

      <div v-if="showDetails" class="cookie-categories">
        <div class="cookie-category">
          <div class="cookie-category-header">
            <label>
              <input type="checkbox" checked disabled />
              <strong>Cookies nécessaires</strong>
            </label>
            <span class="cookie-badge cookie-badge-required">Obligatoire</span>
          </div>
          <p>Indispensables au fonctionnement du site (authentification, sécurité, session).</p>
        </div>

        <div class="cookie-category">
          <div class="cookie-category-header">
            <label>
              <input type="checkbox" v-model="preferences.analytics" />
              <strong>Cookies analytiques</strong>
            </label>
          </div>
          <p>Nous aident à comprendre comment vous utilisez le site (pages visitées, durée).</p>
        </div>

        <div class="cookie-category">
          <div class="cookie-category-header">
            <label>
              <input type="checkbox" v-model="preferences.marketing" />
              <strong>Cookies marketing</strong>
            </label>
          </div>
          <p>Permettent de vous proposer des contenus et événements personnalisés.</p>
        </div>
      </div>

      <div class="cookie-banner-actions">
        <button class="btn btn-outline btn-sm" @click="rejectAll">
          Tout refuser
        </button>
        <button class="btn btn-outline btn-sm" @click="showDetails = !showDetails">
          {{ showDetails ? 'Masquer' : 'Personnaliser' }}
        </button>
        <button v-if="showDetails" class="btn btn-primary btn-sm" @click="savePreferences">
          Enregistrer mes choix
        </button>
        <button class="btn btn-primary btn-sm" @click="acceptAll">
          Tout accepter
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--white);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 1.5rem;
}

.cookie-banner-content {
  max-width: 900px;
  margin: 0 auto;
}

.cookie-banner-text h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--dark);
}

.cookie-banner-text p {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.5;
}

.cookie-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: underline;
}

.cookie-categories {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cookie-category {
  background: var(--gray-lighter);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
}

.cookie-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.cookie-category-header label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.cookie-category p {
  font-size: 0.8rem;
  color: var(--gray);
  margin-left: 1.5rem;
}

.cookie-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-weight: 600;
}

.cookie-badge-required {
  background: var(--gray-light);
  color: var(--gray);
}

.cookie-banner-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
