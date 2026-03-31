<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const userData = ref(null)
const consentLogs = ref([])
const loading = ref(true)
const editing = ref(false)
const showAnonymizeConfirm = ref(false)
const message = ref('')
const messageType = ref('success')

const editForm = ref({
  name: '',
  email: '',
  phone: '',
})

async function fetchMyData() {
  try {
    loading.value = true
    const { data } = await api.get('/rgpd/my-data')
    userData.value = data.user

    editForm.value = {
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone || '',
    }

    const logsRes = await api.get('/rgpd/consent-logs')
    consentLogs.value = logsRes.data
  } catch (err) {
    showMessage('Erreur lors du chargement des données.', 'error')
  } finally {
    loading.value = false
  }
}

async function saveChanges() {
  try {
    const { data } = await api.put('/rgpd/my-data', editForm.value)
    userData.value = { ...userData.value, ...data.user }
    editing.value = false
    showMessage('Données mises à jour avec succès.')

    // Mettre à jour le store auth
    authStore.user = { ...authStore.user, name: data.user.name, email: data.user.email }
    localStorage.setItem('user', JSON.stringify(authStore.user))
  } catch (err) {
    showMessage(err.response?.data?.message || 'Erreur lors de la mise à jour.', 'error')
  }
}

async function anonymizeAccount() {
  try {
    await api.delete('/rgpd/my-data')
    showMessage('Votre compte a été anonymisé.')
    showAnonymizeConfirm.value = false

    // Déconnecter l'utilisateur après anonymisation
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 2000)
  } catch (err) {
    showMessage(err.response?.data?.message || 'Erreur lors de l\'anonymisation.', 'error')
  }
}

async function exportData() {
  try {
    const { data } = await api.get('/rgpd/export')
    // Télécharger le JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mes-donnees-eventflow-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('Export téléchargé avec succès.')
  } catch (err) {
    showMessage('Erreur lors de l\'export.', 'error')
  }
}

async function withdrawConsent() {
  try {
    await api.post('/rgpd/consent', { consent: false })
    showMessage('Consentement retiré.')
    await fetchMyData()
  } catch (err) {
    showMessage('Erreur lors du retrait du consentement.', 'error')
  }
}

function showMessage(msg, type = 'success') {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 4000)
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionLabel(action) {
  const labels = {
    consent_given: 'Consentement donné',
    consent_withdrawn: 'Consentement retiré',
    data_accessed: 'Données consultées',
    data_deleted: 'Données supprimées',
    data_modified: 'Données modifiées',
  }
  return labels[action] || action
}

onMounted(fetchMyData)
</script>

<template>
  <div class="page">
    <div class="container my-data-page">
      <h1 class="page-title">Mes données personnelles</h1>
      <p class="page-subtitle">
        Conformément au RGPD, vous pouvez consulter, modifier, exporter ou supprimer vos données personnelles.
      </p>

      <div v-if="message" :class="['alert', `alert-${messageType}`]">
        {{ message }}
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <template v-else-if="userData">
        <!-- Informations personnelles -->
        <div class="card my-data-section">
          <div class="section-header">
            <h2>Informations personnelles</h2>
            <button
              v-if="!editing && !userData.isAnonymized"
              class="btn btn-outline btn-sm"
              @click="editing = true"
            >
              Modifier
            </button>
          </div>

          <div v-if="userData.isAnonymized" class="alert alert-warning">
            Ce compte a été anonymisé. Les données personnelles ont été supprimées.
          </div>

          <div v-if="!editing">
            <div class="data-row">
              <span class="data-label">Nom</span>
              <span class="data-value">{{ userData.name }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Email</span>
              <span class="data-value">{{ userData.email }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Téléphone</span>
              <span class="data-value">{{ userData.phone || 'Non renseigné' }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Rôle</span>
              <span class="data-value">{{ userData.role }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Inscrit le</span>
              <span class="data-value">{{ formatDate(userData.createdAt) }}</span>
            </div>
          </div>

          <!-- Formulaire de modification -->
          <form v-else @submit.prevent="saveChanges">
            <div class="form-group">
              <label for="edit-name">Nom</label>
              <input id="edit-name" v-model="editForm.name" type="text" required />
            </div>
            <div class="form-group">
              <label for="edit-email">Email</label>
              <input id="edit-email" v-model="editForm.email" type="email" required />
            </div>
            <div class="form-group">
              <label for="edit-phone">Téléphone</label>
              <input id="edit-phone" v-model="editForm.phone" type="tel" placeholder="Optionnel" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline btn-sm" @click="editing = false">Annuler</button>
              <button type="submit" class="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </form>
        </div>

        <!-- Consentement -->
        <div class="card my-data-section">
          <h2>Consentement RGPD</h2>
          <div class="data-row">
            <span class="data-label">Statut</span>
            <span :class="['data-value', 'consent-status', userData.consentDate ? 'consent-active' : 'consent-inactive']">
              {{ userData.consentDate ? 'Actif' : 'Non donné' }}
            </span>
          </div>
          <div v-if="userData.consentDate" class="data-row">
            <span class="data-label">Date de consentement</span>
            <span class="data-value">{{ formatDate(userData.consentDate) }}</span>
          </div>
          <div v-if="userData.consentVersion" class="data-row">
            <span class="data-label">Version</span>
            <span class="data-value">{{ userData.consentVersion }}</span>
          </div>

          <div v-if="userData.consentDate" class="form-actions" style="margin-top: 1rem;">
            <button class="btn btn-outline btn-sm" @click="withdrawConsent">
              Retirer mon consentement
            </button>
          </div>
        </div>

        <!-- Actions RGPD -->
        <div class="card my-data-section">
          <h2>Vos droits RGPD</h2>
          <div class="rgpd-actions">
            <div class="rgpd-action-card">
              <h3>Exporter mes données</h3>
              <p>Téléchargez toutes vos données personnelles au format JSON (droit à la portabilité).</p>
              <button class="btn btn-secondary btn-sm" @click="exportData">
                Exporter (JSON)
              </button>
            </div>

            <div class="rgpd-action-card rgpd-action-danger">
              <h3>Anonymiser mon compte</h3>
              <p>Vos données personnelles seront définitivement remplacées par des données anonymes. Cette action est irréversible.</p>
              <button class="btn btn-danger btn-sm" @click="showAnonymizeConfirm = true">
                Anonymiser mon compte
              </button>
            </div>
          </div>
        </div>

        <!-- Historique des accès -->
        <div class="card my-data-section">
          <h2>Historique des accès et consentements</h2>
          <p class="section-desc">Journal des actions liées à vos données personnelles.</p>

          <div v-if="consentLogs.length === 0" class="empty-state">
            Aucun log enregistré.
          </div>

          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in consentLogs" :key="log._id">
                  <td>{{ formatDate(log.timestamp) }}</td>
                  <td>
                    <span :class="['log-badge', `log-${log.action}`]">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td>{{ log.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Modal de confirmation d'anonymisation -->
      <div v-if="showAnonymizeConfirm" class="modal-overlay" @click.self="showAnonymizeConfirm = false">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Confirmer l'anonymisation</h2>
            <button class="modal-close" @click="showAnonymizeConfirm = false">&times;</button>
          </div>
          <p style="margin-bottom: 1rem; color: var(--gray);">
            Cette action est <strong>irréversible</strong>. Vos données personnelles (nom, email, téléphone)
            seront remplacées par des données anonymes. Votre compte sera déconnecté.
          </p>
          <p style="margin-bottom: 1.5rem; color: var(--danger); font-weight: 600;">
            Les logs de consentement seront conservés conformément à nos obligations légales.
          </p>
          <div class="form-actions">
            <button class="btn btn-outline" @click="showAnonymizeConfirm = false">Annuler</button>
            <button class="btn btn-danger" @click="anonymizeAccount">Confirmer l'anonymisation</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-data-page {
  max-width: 800px;
}

.page-subtitle {
  color: var(--gray);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.my-data-section {
  margin-bottom: 1.5rem;
}

.my-data-section h2 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
  color: var(--dark);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin-bottom: 0;
}

.section-desc {
  font-size: 0.85rem;
  color: var(--gray);
  margin-bottom: 1rem;
}

.data-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--gray-light);
}

.data-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--gray);
}

.data-value {
  font-size: 0.9rem;
}

.consent-status {
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.consent-active {
  background: #d1fae5;
  color: #065f46;
}

.consent-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.rgpd-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.rgpd-action-card {
  background: var(--gray-lighter);
  border-radius: var(--radius);
  padding: 1rem;
}

.rgpd-action-card h3 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.rgpd-action-card p {
  font-size: 0.8rem;
  color: var(--gray);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.rgpd-action-danger {
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
  font-size: 0.9rem;
}

.log-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.log-consent_given { background: #d1fae5; color: #065f46; }
.log-consent_withdrawn { background: #fee2e2; color: #991b1b; }
.log-data_accessed { background: #dbeafe; color: #1e40af; }
.log-data_deleted { background: #fecaca; color: #991b1b; }
.log-data_modified { background: #fef3c7; color: #92400e; }

@media (max-width: 640px) {
  .rgpd-actions {
    grid-template-columns: 1fr;
  }

  .data-row {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
