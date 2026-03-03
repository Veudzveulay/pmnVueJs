<script setup>
import { onMounted } from 'vue'
import { useEventStore } from '../stores/events'
import EventCard from '../components/EventCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const eventStore = useEventStore()

onMounted(() => {
  eventStore.fetchEvents()
})
</script>

<template>
  <div class="container page">
    <h1 class="page-title">Événements</h1>

    <!-- Filtres -->
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

    <div v-else class="card" style="text-align: center; padding: 3rem;">
      <p style="color: var(--gray);">Aucun événement trouvé.</p>
    </div>
  </div>
</template>
