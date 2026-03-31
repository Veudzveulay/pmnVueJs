<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useEventStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import L from 'leaflet'

const eventStore = useEventStore()
const authStore = useAuthStore()
const router = useRouter()

const mapContainer = ref(null)
let map = null
const markersLayer = L.layerGroup()

// Filtrer les événements qui ont des coordonnées
const geoEvents = computed(() =>
  eventStore.events.filter((e) => e.coordinates?.lat && e.coordinates?.lng)
)

onMounted(async () => {
  if (!eventStore.events.length) {
    await eventStore.fetchEvents()
  }
  nextTick(() => initMap())
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView([46.6034, 2.3488], 6) // Centre de la France

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  markersLayer.addTo(map)
  addMarkers()
}

function addMarkers() {
  markersLayer.clearLayers()

  const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const bounds = []

  geoEvents.value.forEach((event) => {
    const { lat, lng } = event.coordinates
    bounds.push([lat, lng])

    const spotsLeft = event.maxParticipants - event.participants.length
    const isRegistered = event.participants.some((p) => p._id === authStore.user?.id)
    const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 0.35rem; font-size: 1rem; color: #1e293b;">${event.title}</h3>
        <p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #64748b;">${formattedDate}</p>
        <p style="margin: 0 0 0.25rem; font-size: 0.8rem; color: #64748b;">${event.location}</p>
        <p style="margin: 0 0 0.5rem; font-size: 0.8rem;">
          <span style="font-weight: 600; color: ${spotsLeft > 0 ? '#065f46' : '#991b1b'};">
            ${spotsLeft > 0 ? spotsLeft + ' place(s) restante(s)' : 'Complet'}
          </span>
          ${isRegistered ? ' — <span style="color: #065f46; font-weight: 600;">Inscrit</span>' : ''}
        </p>
        <a href="/events/${event._id}"
           style="display: inline-block; padding: 0.3rem 0.6rem; background: #4f46e5; color: white; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-decoration: none;">
          Voir l'événement
        </a>
      </div>
    `

    const m = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer)
    m.bindPopup(popupContent)
  })

  // Ajuster la vue pour voir tous les marqueurs
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
  }
}

// Intercepter les clics sur les liens dans les popups
onMounted(() => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/events/"]')
    if (link) {
      e.preventDefault()
      router.push(link.getAttribute('href'))
    }
  })
})
</script>

<template>
  <div class="container page">
    <h1 class="page-title">Carte des événements</h1>

    <div v-if="geoEvents.length === 0 && !eventStore.loading" class="card" style="text-align: center; padding: 2rem;">
      <p style="color: var(--gray); margin-bottom: 0.5rem;">Aucun événement géolocalisé pour le moment.</p>
      <p style="color: var(--gray); font-size: 0.85rem;">Les événements apparaîtront ici lorsqu'un organisateur choisira un lieu sur la carte.</p>
    </div>

    <div ref="mapContainer" class="map-fullview"></div>

    <div v-if="geoEvents.length" class="map-legend">
      {{ geoEvents.length }} événement(s) sur la carte
    </div>
  </div>
</template>

<style scoped>
.map-fullview {
  width: 100%;
  height: 550px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  z-index: 1;
}

.map-legend {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--gray);
  text-align: center;
}
</style>
