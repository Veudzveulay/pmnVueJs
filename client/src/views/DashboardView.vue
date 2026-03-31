<script setup>
import { onMounted, computed } from 'vue'
import { useEventStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import EventCard from '../components/EventCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useRouter } from 'vue-router'

const eventStore = useEventStore()
const authStore = useAuthStore()
const router = useRouter()

const isOrganisateur = computed(() => authStore.isOrganisateur || authStore.isAdmin)

// Événements créés par l'organisateur
const myEvents = computed(() =>
  eventStore.events.filter((e) => e.organizer?._id === authStore.user?.id)
)

// Événements des autres (pour la section "Découvrir")
const otherEvents = computed(() =>
  eventStore.filteredEvents.filter((e) => e.organizer?._id !== authStore.user?.id)
)

// Stats organisateur
const totalParticipants = computed(() =>
  myEvents.value.reduce((sum, e) => sum + e.participants.length, 0)
)

const totalSpots = computed(() =>
  myEvents.value.reduce((sum, e) => sum + e.maxParticipants, 0)
)

const fillRate = computed(() => {
  if (totalSpots.value === 0) return 0
  return Math.round((totalParticipants.value / totalSpots.value) * 100)
})

const upcomingMyEvents = computed(() =>
  myEvents.value.filter((e) => new Date(e.date) > new Date()).length
)

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  eventStore.fetchEvents()
})
</script>

<template>
  <div class="container page">

    <!-- ============ VUE ORGANISATEUR ============ -->
    <template v-if="isOrganisateur">
      <div class="dashboard-header">
        <h1 class="page-title">Tableau de bord organisateur</h1>
        <button class="btn btn-primary" @click="router.push('/events/create')">
          + Créer un événement
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ myEvents.length }}</span>
          <span class="stat-label">Événement(s)</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ upcomingMyEvents }}</span>
          <span class="stat-label">À venir</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalParticipants }}</span>
          <span class="stat-label">Inscrit(s) total</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ fillRate }}%</span>
          <span class="stat-label">Taux de remplissage</span>
        </div>
      </div>

      <LoadingSpinner v-if="eventStore.loading" />

      <!-- Mes événements -->
      <template v-else>
        <h2 class="section-title">Mes événements</h2>

        <div v-if="myEvents.length === 0" class="card empty-card">
          <p>Vous n'avez pas encore créé d'événement.</p>
          <button class="btn btn-primary btn-sm" @click="router.push('/events/create')">
            Créer mon premier événement
          </button>
        </div>

        <div v-else class="my-events-list">
          <div
            v-for="event in myEvents"
            :key="event._id"
            class="card my-event-card"
          >
            <div class="my-event-info">
              <h3 class="my-event-title" @click="router.push(`/events/${event._id}`)">
                {{ event.title }}
              </h3>
              <div class="my-event-meta">
                <span>{{ formatDate(event.date) }}</span>
                <span class="my-event-location" :title="event.location">{{ event.location }}</span>
              </div>
            </div>

            <div class="my-event-stats">
              <div class="my-event-fill">
                <div class="fill-bar">
                  <div
                    class="fill-bar-inner"
                    :style="{ width: Math.round((event.participants.length / event.maxParticipants) * 100) + '%' }"
                    :class="{ 'fill-full': event.participants.length >= event.maxParticipants }"
                  ></div>
                </div>
                <span class="fill-text">
                  {{ event.participants.length }} / {{ event.maxParticipants }} inscrits
                </span>
              </div>
            </div>

            <div class="my-event-actions">
              <button class="btn btn-sm btn-primary" @click="router.push(`/events/${event._id}`)">
                Voir
              </button>
              <button class="btn btn-sm btn-secondary" @click="router.push(`/events/${event._id}/edit`)">
                Modifier
              </button>
              <button class="btn btn-sm btn-outline" @click="router.push(`/events/${event._id}/scan`)">
                Scanner QR
              </button>
            </div>
          </div>
        </div>

        <!-- Autres événements -->
        <h2 class="section-title" style="margin-top: 2.5rem;">Tous les événements</h2>

        <div class="filters">
          <input
            v-model="eventStore.searchQuery"
            type="text"
            placeholder="Rechercher..."
          />
          <input
            v-model="eventStore.dateFilter"
            type="date"
          />
          <button
            v-if="eventStore.searchQuery || eventStore.dateFilter"
            class="btn btn-sm btn-outline"
            @click="eventStore.searchQuery = ''; eventStore.dateFilter = ''"
          >
            Réinitialiser
          </button>
        </div>

        <div v-if="otherEvents.length" class="events-grid">
          <EventCard
            v-for="event in otherEvents"
            :key="event._id"
            :event="event"
          />
        </div>

        <div v-else class="card empty-card">
          <p>Aucun autre événement trouvé.</p>
        </div>
      </template>
    </template>

    <!-- ============ VUE PARTICIPANT ============ -->
    <template v-else>
      <h1 class="page-title">Événements</h1>

      <div class="filters">
        <input
          v-model="eventStore.searchQuery"
          type="text"
          placeholder="Rechercher un événement..."
        />
        <input
          v-model="eventStore.dateFilter"
          type="date"
        />
        <button
          v-if="eventStore.searchQuery || eventStore.dateFilter"
          class="btn btn-sm btn-outline"
          @click="eventStore.searchQuery = ''; eventStore.dateFilter = ''"
        >
          Réinitialiser
        </button>
      </div>

      <LoadingSpinner v-if="eventStore.loading" />

      <div v-else-if="eventStore.filteredEvents.length" class="events-grid">
        <EventCard
          v-for="event in eventStore.filteredEvents"
          :key="event._id"
          :event="event"
        />
      </div>

      <div v-else class="card empty-card">
        <p>Aucun événement trouvé.</p>
      </div>
    </template>

  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: 600;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 1rem;
}

.my-events-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.my-event-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
}

.my-event-info {
  flex: 1;
  min-width: 0;
}

.my-event-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--dark);
  cursor: pointer;
  transition: color 0.2s;
}

.my-event-title:hover {
  color: var(--primary);
}

.my-event-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--gray);
  margin-top: 0.25rem;
}

.my-event-location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.my-event-stats {
  flex-shrink: 0;
  width: 160px;
}

.fill-bar {
  height: 8px;
  background: var(--gray-light);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.fill-bar-inner {
  height: 100%;
  background: var(--success);
  border-radius: 999px;
  transition: width 0.3s;
}

.fill-bar-inner.fill-full {
  background: var(--danger);
}

.fill-text {
  font-size: 0.75rem;
  color: var(--gray);
}

.my-event-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.empty-card {
  text-align: center;
  padding: 2.5rem;
  color: var(--gray);
}

.empty-card p {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .my-event-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .my-event-stats {
    width: 100%;
  }

  .my-event-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
