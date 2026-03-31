<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const eventId = route.params.id

const qrInput = ref('')
const result = ref(null)
const loading = ref(false)
const error = ref('')

async function validateQR() {
  if (!qrInput.value.trim()) {
    error.value = 'Veuillez coller le contenu du QR code.'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  try {
    // Parser le JSON du QR code
    let qrData
    try {
      qrData = JSON.parse(qrInput.value)
    } catch {
      error.value = 'QR code invalide. Le format n\'est pas reconnu.'
      loading.value = false
      return
    }

    const { data } = await api.post(`/events/${eventId}/validate-qr`, {
      token: qrData.token,
      userId: qrData.userId,
    })

    result.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la validation.'
    result.value = err.response?.data || null
  } finally {
    loading.value = false
  }
}

function reset() {
  qrInput.value = ''
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="container page">
    <div class="scan-page">
      <button class="btn btn-sm btn-outline" style="margin-bottom: 1.5rem;" @click="$router.push(`/events/${eventId}`)">
        &larr; Retour à l'événement
      </button>

      <h1 class="page-title">Scanner un QR Code</h1>
      <p class="scan-desc">
        Collez le contenu du QR code scanné par votre appareil pour valider la présence d'un participant.
      </p>

      <div class="card scan-card">
        <div class="form-group">
          <label for="qr-input">Contenu du QR code</label>
          <textarea
            id="qr-input"
            v-model="qrInput"
            rows="4"
            placeholder='Collez ici le contenu du QR code...'
          ></textarea>
        </div>

        <div class="scan-actions">
          <button
            class="btn btn-primary"
            :disabled="loading || !qrInput.trim()"
            @click="validateQR"
          >
            {{ loading ? 'Validation...' : 'Valider le QR code' }}
          </button>
          <button class="btn btn-outline" @click="reset">
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Résultat -->
      <div v-if="result" :class="['card', 'result-card', result.valid ? 'result-valid' : 'result-invalid']">
        <div class="result-icon">{{ result.valid ? '✅' : '❌' }}</div>
        <h2>{{ result.valid ? 'Participant vérifié' : 'QR code invalide' }}</h2>
        <p class="result-message">{{ result.message }}</p>

        <div v-if="result.valid && result.participant" class="result-details">
          <div class="result-row">
            <span class="result-label">Participant</span>
            <span class="result-value">{{ result.participant.name }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Email</span>
            <span class="result-value">{{ result.participant.email }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Événement</span>
            <span class="result-value">{{ result.eventTitle }}</span>
          </div>
        </div>
      </div>

      <div v-if="error && !result" class="card result-card result-invalid">
        <div class="result-icon">❌</div>
        <p class="result-message">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan-page {
  max-width: 600px;
  margin: 0 auto;
}

.scan-desc {
  color: var(--gray);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.scan-card {
  margin-bottom: 1.5rem;
}

.scan-actions {
  display: flex;
  gap: 0.5rem;
}

.result-card {
  text-align: center;
  padding: 2rem;
}

.result-valid {
  border: 2px solid var(--success);
}

.result-invalid {
  border: 2px solid var(--danger);
}

.result-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.result-card h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.result-message {
  color: var(--gray);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.result-details {
  text-align: left;
  background: var(--gray-lighter);
  border-radius: var(--radius);
  padding: 1rem;
  margin-top: 1rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--gray-light);
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--gray);
}

.result-value {
  font-size: 0.85rem;
}
</style>
