<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import api from '../services/api'
import L from 'leaflet'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const authStore = useAuthStore()

const event = computed(() => eventStore.currentEvent)

const qrCode = ref(null)
const qrLoading = ref(false)
const showQR = ref(false)
const miniMapContainer = ref(null)
let miniMap = null

const hasCoordinates = computed(() =>
  event.value?.coordinates?.lat && event.value?.coordinates?.lng
)

onMounted(async () => {
  await eventStore.fetchEvent(route.params.id)
  if (hasCoordinates.value) {
    nextTick(() => {
      setTimeout(() => initMiniMap(), 300)
    })
  }
})

onUnmounted(() => {
  if (miniMap) {
    miniMap.remove()
    miniMap = null
  }
})

// Aussi surveiller si les coordonnées arrivent après le mount
watch(hasCoordinates, (val) => {
  if (val && !miniMap) {
    nextTick(() => {
      setTimeout(() => initMiniMap(), 300)
    })
  }
})

function initMiniMap() {
  if (!miniMapContainer.value || miniMap) return
  const { lat, lng } = event.value.coordinates

  miniMap = L.map(miniMapContainer.value, {
    scrollWheelZoom: false,
    dragging: true,
    zoomControl: true,
  }).setView([lat, lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(miniMap)

  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  L.marker([lat, lng], { icon }).addTo(miniMap).bindPopup(event.value.location).openPopup()

  // Forcer le recalcul de la taille après le rendu complet
  setTimeout(() => {
    miniMap.invalidateSize()
  }, 200)
}

const formattedDate = computed(() => {
  if (!event.value) return ''
  return new Date(event.value.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const spotsLeft = computed(() => {
  if (!event.value) return 0
  return event.value.maxParticipants - event.value.participants.length
})

const isRegistered = computed(() => {
  return event.value?.participants.some((p) => p._id === authStore.user?.id)
})

const isOwner = computed(() => {
  return event.value?.organizer?._id === authStore.user?.id
})

const canEdit = computed(() => {
  return isOwner.value || authStore.isAdmin
})

async function toggleRegistration() {
  try {
    if (isRegistered.value) {
      await eventStore.unregisterFromEvent(event.value._id)
      qrCode.value = null
      showQR.value = false
    } else {
      await eventStore.registerToEvent(event.value._id)
    }
  } catch {
    // Erreur gérée dans le store
  }
}

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return
  try {
    await eventStore.deleteEvent(event.value._id)
    router.push('/')
  } catch {
    // Erreur gérée dans le store
  }
}

async function fetchQRCode() {
  if (qrCode.value) {
    showQR.value = !showQR.value
    return
  }
  qrLoading.value = true
  try {
    const { data } = await api.get(`/events/${event.value._id}/qrcode`)
    qrCode.value = data
    showQR.value = true
  } catch {
    // silencieux
  } finally {
    qrLoading.value = false
  }
}
</script>

<template>
  <div class="container page">
    <LoadingSpinner v-if="eventStore.loading" />

    <div v-else-if="event" class="event-detail">
      <button class="btn btn-sm btn-outline" style="margin-bottom: 1.5rem;" @click="router.push('/')">
        &larr; Retour
      </button>

      <h1>{{ event.title }}</h1>

      <div class="event-detail-meta">
        <span>{{ formattedDate }}</span>
        <span>{{ event.location }}</span>
        <span>Organisé par {{ event.organizer?.name }}</span>
        <span :class="['spots-badge', spotsLeft > 0 ? 'spots-available' : 'spots-full']">
          {{ spotsLeft > 0 ? `${spotsLeft} place(s) restante(s)` : 'Complet' }}
        </span>
      </div>

      <p class="event-detail-desc">{{ event.description }}</p>

      <!-- Mini-carte du lieu -->
      <div v-if="hasCoordinates" class="card mini-map-card">
        <h3 style="margin-bottom: 0.75rem;">Lieu</h3>
        <div ref="miniMapContainer" class="mini-map"></div>
      </div>

      <div style="display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap;">
        <button
          v-if="!isOwner"
          class="btn"
          :class="isRegistered ? 'btn-danger' : 'btn-success'"
          :disabled="!isRegistered && spotsLeft <= 0"
          @click="toggleRegistration"
        >
          {{ isRegistered ? 'Se désinscrire' : "S'inscrire" }}
        </button>

        <!-- QR Code pour les participants inscrits -->
        <button
          v-if="isRegistered"
          class="btn btn-secondary"
          :disabled="qrLoading"
          @click="fetchQRCode"
        >
          {{ qrLoading ? 'Chargement...' : (showQR ? 'Masquer QR' : 'Mon QR Code') }}
        </button>

        <button
          v-if="canEdit"
          class="btn btn-secondary"
          @click="router.push(`/events/${event._id}/edit`)"
        >
          Modifier
        </button>

        <!-- Bouton scanner pour l'organisateur -->
        <button
          v-if="canEdit"
          class="btn btn-outline"
          @click="router.push(`/events/${event._id}/scan`)"
        >
          Scanner QR
        </button>

        <button
          v-if="canEdit"
          class="btn btn-danger"
          @click="handleDelete"
        >
          Supprimer
        </button>
      </div>

      <!-- QR Code affiché -->
      <div v-if="showQR && qrCode" class="card qr-card">
        <h3>Votre QR Code de participation</h3>
        <p class="qr-subtitle">Présentez ce QR code à l'entrée de l'événement pour valider votre présence.</p>
        <img :src="qrCode.qrCode" :alt="`QR Code - ${qrCode.eventTitle}`" class="qr-image" />
        <div class="qr-info">
          <span><strong>Participant :</strong> {{ qrCode.userName }}</span>
          <span><strong>Événement :</strong> {{ qrCode.eventTitle }}</span>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 1rem;">
          Participants ({{ event.participants.length }} / {{ event.maxParticipants }})
        </h3>
        <ul v-if="event.participants.length" class="participants-list">
          <li v-for="participant in event.participants" :key="participant._id">
            {{ participant.name }} — {{ participant.email }}
          </li>
        </ul>
        <p v-else style="color: var(--gray);">Aucun participant pour le moment.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-card {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
}

.qr-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.qr-subtitle {
  font-size: 0.85rem;
  color: var(--gray);
  margin-bottom: 1rem;
}

.qr-image {
  width: 250px;
  height: 250px;
  margin: 0 auto;
  display: block;
  border-radius: var(--radius);
  border: 2px solid var(--gray-light);
}

.qr-info {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--gray);
}

.mini-map-card {
  margin-bottom: 1.5rem;
}

.mini-map {
  width: 100%;
  height: 300px;
  border-radius: var(--radius);
  z-index: 1;
}
</style>
