<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/events'

const router = useRouter()
const eventStore = useEventStore()

const form = ref({
  title: '',
  description: '',
  date: '',
  location: '',
  maxParticipants: 10,
})
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  try {
    await eventStore.createEvent(form.value)
    router.push('/')
  } catch {
    errorMsg.value = eventStore.error
  }
}
</script>

<template>
  <div class="container page">
    <div style="max-width: 600px; margin: 0 auto;">
      <button class="btn btn-sm btn-outline" style="margin-bottom: 1.5rem;" @click="router.push('/')">
        &larr; Retour
      </button>

      <div class="card">
        <h1 class="page-title">Créer un événement</h1>

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
              placeholder="Nom de l'événement"
              required
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Décrivez votre événement..."
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
            <label for="location">Lieu</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              placeholder="Lieu de l'événement"
              required
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
            {{ eventStore.loading ? 'Création...' : 'Créer l\'événement' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
