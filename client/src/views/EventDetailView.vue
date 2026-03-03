<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const authStore = useAuthStore()

onMounted(() => {
  eventStore.fetchEvent(route.params.id)
})

const event = computed(() => eventStore.currentEvent)

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

      <div style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
        <button
          v-if="!isOwner"
          class="btn"
          :class="isRegistered ? 'btn-danger' : 'btn-success'"
          :disabled="!isRegistered && spotsLeft <= 0"
          @click="toggleRegistration"
        >
          {{ isRegistered ? 'Se désinscrire' : "S'inscrire" }}
        </button>

        <button
          v-if="canEdit"
          class="btn btn-secondary"
          @click="router.push(`/events/${event._id}/edit`)"
        >
          Modifier
        </button>

        <button
          v-if="canEdit"
          class="btn btn-danger"
          @click="handleDelete"
        >
          Supprimer
        </button>
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
