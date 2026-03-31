<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/events'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import LocationPicker from '../components/LocationPicker.vue'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const form = ref({
  title: '',
  description: '',
  date: '',
  location: '',
  maxParticipants: 10,
  coordinates: null,
})
const errorMsg = ref('')

onMounted(async () => {
  try {
    const event = await eventStore.fetchEvent(route.params.id)
    form.value = {
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      maxParticipants: event.maxParticipants,
      coordinates: event.coordinates?.lat ? event.coordinates : null,
    }
  } catch {
    router.push('/')
  }
})

function onLocationUpdate(address) {
  form.value.location = address
}

async function handleSubmit() {
  errorMsg.value = ''
  try {
    await eventStore.updateEvent(route.params.id, form.value)
    router.push(`/events/${route.params.id}`)
  } catch {
    errorMsg.value = eventStore.error
  }
}
</script>

<template>
  <div class="container page">
    <div style="max-width: 700px; margin: 0 auto;">
      <button class="btn btn-sm btn-outline" style="margin-bottom: 1.5rem;" @click="router.back()">
        &larr; Retour
      </button>

      <LoadingSpinner v-if="eventStore.loading && !form.title" />

      <div v-else class="card">
        <h1 class="page-title">Modifier l'événement</h1>

        <div v-if="errorMsg" class="form-error" style="margin-bottom: 1rem;">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="title">Titre</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="date">Date et heure</label>
            <input
              id="date"
              v-model="form.date"
              type="datetime-local"
              required
            />
          </div>

          <div class="form-group">
            <label>Lieu</label>
            <LocationPicker
              v-model="form.coordinates"
              :location="form.location"
              @update:location="onLocationUpdate"
            />
            <input
              v-model="form.location"
              type="text"
              placeholder="Ou saisissez l'adresse manuellement"
              required
              style="margin-top: 0.5rem;"
            />
          </div>

          <div class="form-group">
            <label for="maxParticipants">Nombre de places</label>
            <input
              id="maxParticipants"
              v-model.number="form.maxParticipants"
              type="number"
              min="1"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="eventStore.loading">
            {{ eventStore.loading ? 'Mise à jour...' : 'Enregistrer les modifications' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
