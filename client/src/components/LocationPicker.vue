<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'

const props = defineProps({
  modelValue: { type: Object, default: null }, // { lat, lng }
  location: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:location'])

const mapContainer = ref(null)
let map = null
let marker = null

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const selectedAddress = ref('')

// Coordonnées par défaut : Paris
const defaultCoords = { lat: 48.8566, lng: 2.3522 }

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function initMap() {
  if (!mapContainer.value) return

  const initialCoords = props.modelValue || defaultCoords
  const initialZoom = props.modelValue ? 15 : 6

  map = L.map(mapContainer.value).setView([initialCoords.lat, initialCoords.lng], initialZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  // Si on a déjà des coordonnées, placer le marqueur
  if (props.modelValue) {
    placeMarker(props.modelValue.lat, props.modelValue.lng)
  }

  // Clic sur la carte pour placer le marqueur
  map.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng)
    reverseGeocode(e.latlng.lat, e.latlng.lng)
  })
}

function placeMarker(lat, lng) {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
  }

  emit('update:modelValue', { lat, lng })
}

// Recherche d'adresse via Nominatim (OpenStreetMap)
let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  if (searchQuery.value.length < 3) {
    searchResults.value = []
    return
  }
  searchTimeout = setTimeout(() => {
    searchAddress()
  }, 400)
}

async function searchAddress() {
  if (searchQuery.value.length < 3) return
  searching.value = true
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    searchResults.value = await response.json()
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function selectResult(result) {
  const lat = parseFloat(result.lat)
  const lng = parseFloat(result.lon)

  placeMarker(lat, lng)
  map.setView([lat, lng], 16)

  selectedAddress.value = result.display_name
  emit('update:location', result.display_name)

  searchQuery.value = ''
  searchResults.value = []
}

// Géocodage inverse : obtenir l'adresse à partir des coordonnées
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await response.json()
    if (data.display_name) {
      selectedAddress.value = data.display_name
      emit('update:location', data.display_name)
    }
  } catch {
    // silencieux
  }
}

// Surveiller les changements de props pour repositionner le marqueur
watch(() => props.modelValue, (newVal) => {
  if (newVal && map && !marker) {
    placeMarker(newVal.lat, newVal.lng)
    map.setView([newVal.lat, newVal.lng], 15)
  }
}, { deep: true })
</script>

<template>
  <div class="location-picker">
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une adresse..."
        class="search-input"
        @input="onSearchInput"
      />
      <div v-if="searching" class="search-loading">Recherche...</div>

      <ul v-if="searchResults.length" class="search-results">
        <li
          v-for="result in searchResults"
          :key="result.place_id"
          @click="selectResult(result)"
        >
          {{ result.display_name }}
        </li>
      </ul>
    </div>

    <div ref="mapContainer" class="map-container"></div>

    <p v-if="selectedAddress" class="selected-address">
      {{ selectedAddress }}
    </p>
    <p v-else class="map-hint">
      Recherchez une adresse ou cliquez sur la carte pour placer le lieu.
    </p>
  </div>
</template>

<style scoped>
.location-picker {
  position: relative;
}

.search-container {
  position: relative;
  margin-bottom: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 2px solid var(--gray-light);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-loading {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--gray);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--white);
  border: 1px solid var(--gray-light);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  z-index: 500;
  max-height: 200px;
  overflow-y: auto;
}

.search-results li {
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid var(--gray-lighter);
  color: var(--dark);
}

.search-results li:last-child {
  border-bottom: none;
}

.search-results li:hover {
  background: var(--gray-lighter);
}

.map-container {
  width: 100%;
  height: 350px;
  border-radius: var(--radius);
  border: 2px solid var(--gray-light);
  z-index: 1;
}

.selected-address {
  font-size: 0.8rem;
  color: var(--success);
  margin-top: 0.35rem;
  font-weight: 500;
}

.map-hint {
  font-size: 0.8rem;
  color: var(--gray);
  margin-top: 0.35rem;
}
</style>
