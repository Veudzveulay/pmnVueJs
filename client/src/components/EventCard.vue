<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useEventStore } from '../stores/events'
import { useRouter } from 'vue-router'

const props = defineProps({
  event: { type: Object, required: true },
})

const authStore = useAuthStore()
const eventStore = useEventStore()
const router = useRouter()

const formattedDate = computed(() => {
  return new Date(props.event.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const spotsLeft = computed(() => {
  return props.event.maxParticipants - props.event.participants.length
})

const isRegistered = computed(() => {
  return props.event.participants.some((p) => p._id === authStore.user?.id)
})

const isOwner = computed(() => {
  return props.event.organizer?._id === authStore.user?.id
})

const canEdit = computed(() => {
  return isOwner.value || authStore.isAdmin
})

async function toggleRegistration() {
  try {
    if (isRegistered.value) {
      await eventStore.unregisterFromEvent(props.event._id)
    } else {
      await eventStore.registerToEvent(props.event._id)
    }
  } catch {
    // Erreur gérée dans le store
  }
}
</script>

<template>
  <div class="card event-card">
    <div class="event-card-header">
      <h3 class="event-card-title">{{ event.title }}</h3>
      <span class="event-card-date">{{ formattedDate }}</span>
    </div>

    <p class="event-card-desc">{{ event.description }}</p>

    <div class="event-card-location" :title="event.location">{{ event.location }}</div>

    <div class="event-card-meta">
      <span>Par {{ event.organizer?.name }}</span>
      <span :class="['spots-badge', spotsLeft > 0 ? 'spots-available' : 'spots-full']">
        {{ spotsLeft > 0 ? `${spotsLeft} place(s)` : 'Complet' }}
      </span>
    </div>

    <div class="event-card-actions">
      <button class="btn btn-sm btn-primary" @click="router.push(`/events/${event._id}`)">
        Voir
      </button>

      <button
        v-if="authStore.isAuthenticated && !isOwner && authStore.isParticipant"
        class="btn btn-sm"
        :class="isRegistered ? 'btn-danger' : 'btn-success'"
        :disabled="!isRegistered && spotsLeft <= 0"
        @click="toggleRegistration"
      >
        {{ isRegistered ? 'Se désinscrire' : "S'inscrire" }}
      </button>

      <button
        v-if="canEdit"
        class="btn btn-sm btn-secondary"
        @click="router.push(`/events/${event._id}/edit`)"
      >
        Modifier
      </button>
    </div>
  </div>
</template>

<style scoped>
.event-card-location {
  font-size: 0.85rem;
  color: var(--gray);
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
