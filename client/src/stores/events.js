import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useEventStore = defineStore('events', () => {
  const events = ref([])
  const currentEvent = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const dateFilter = ref('')

  const filteredEvents = computed(() => {
    let result = events.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query)
      )
    }

    if (dateFilter.value) {
      result = result.filter((e) => {
        const eventDate = new Date(e.date).toISOString().split('T')[0]
        return eventDate === dateFilter.value
      })
    }

    return result
  })

  async function fetchEvents() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/events')
      events.value = data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des événements.'
    } finally {
      loading.value = false
    }
  }

  async function fetchEvent(id) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/events/${id}`)
      currentEvent.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEvent(eventData) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post('/events', eventData)
      events.value.push(data)
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id, eventData) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.put(`/events/${id}`, eventData)
      const index = events.value.findIndex((e) => e._id === id)
      if (index !== -1) events.value[index] = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la modification.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/events/${id}`)
      events.value = events.value.filter((e) => e._id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function registerToEvent(id) {
    try {
      const { data } = await api.post(`/events/${id}/register`)
      const index = events.value.findIndex((e) => e._id === id)
      if (index !== -1) events.value[index] = data
      if (currentEvent.value?._id === id) currentEvent.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || "Erreur lors de l'inscription."
      throw err
    }
  }

  async function unregisterFromEvent(id) {
    try {
      const { data } = await api.post(`/events/${id}/unregister`)
      const index = events.value.findIndex((e) => e._id === id)
      if (index !== -1) events.value[index] = data
      if (currentEvent.value?._id === id) currentEvent.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la désinscription.'
      throw err
    }
  }

  return {
    events,
    currentEvent,
    loading,
    error,
    searchQuery,
    dateFilter,
    filteredEvents,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    registerToEvent,
    unregisterFromEvent,
  }
})
