<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventStore } from '../stores/events'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const eventStore = useEventStore()
const authStore = useAuthStore()
const router = useRouter()

const currentDate = ref(new Date())
const viewMode = ref('month') // 'month' ou 'week'
const selectedDay = ref(null)

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())
const monthLabel = computed(() => `${MONTHS[currentMonth.value]} ${currentYear.value}`)

// Obtenir le lundi de la semaine courante
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const weekStart = computed(() => getMonday(currentDate.value))

const weekLabel = computed(() => {
  const start = weekStart.value
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(start)} — ${fmt(end)}`
})

// Générer les jours du calendrier mois
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Quel jour de la semaine commence le mois (0=dim -> 6=sam, on veut lun=0)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  const days = []

  // Jours du mois précédent
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    })
  }

  // Jours du mois courant
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    })
  }

  // Jours du mois suivant pour compléter la grille
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    })
  }

  return days
})

// Générer les jours de la semaine
const weekDays = computed(() => {
  const days = []
  const start = weekStart.value
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({ date: d, isCurrentMonth: true })
  }
  return days
})

// Obtenir les événements pour une date donnée
function getEventsForDate(date) {
  return eventStore.events.filter((e) => {
    const eventDate = new Date(e.date)
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    )
  })
}

// Vérifier si un jour est aujourd'hui
function isToday(date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isSameDay(a, b) {
  return a && b &&
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

// Navigation
function prevPeriod() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 7)
  }
  currentDate.value = d
}

function nextPeriod() {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 7)
  }
  currentDate.value = d
}

function goToday() {
  currentDate.value = new Date()
}

function selectDay(day) {
  selectedDay.value = day.date
}

function isRegistered(event) {
  return event.participants.some((p) => p._id === authStore.user?.id)
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const selectedDayEvents = computed(() => {
  if (!selectedDay.value) return []
  return getEventsForDate(selectedDay.value)
})

onMounted(() => {
  if (!eventStore.events.length) {
    eventStore.fetchEvents()
  }
})
</script>

<template>
  <div class="container page">
    <div class="calendar-header">
      <h1 class="page-title">Calendrier</h1>

      <div class="calendar-controls">
        <div class="calendar-nav">
          <button class="btn btn-sm btn-outline" @click="prevPeriod">&larr;</button>
          <button class="btn btn-sm btn-outline" @click="goToday">Aujourd'hui</button>
          <button class="btn btn-sm btn-outline" @click="nextPeriod">&rarr;</button>
        </div>

        <span class="calendar-label">
          {{ viewMode === 'month' ? monthLabel : weekLabel }}
        </span>

        <div class="view-toggle">
          <button
            :class="['btn', 'btn-sm', viewMode === 'month' ? 'btn-primary' : 'btn-outline']"
            @click="viewMode = 'month'"
          >
            Mois
          </button>
          <button
            :class="['btn', 'btn-sm', viewMode === 'week' ? 'btn-primary' : 'btn-outline']"
            @click="viewMode = 'week'"
          >
            Semaine
          </button>
        </div>
      </div>
    </div>

    <!-- Vue Mois -->
    <div v-if="viewMode === 'month'" class="calendar-grid month-grid">
      <div v-for="day in DAYS" :key="day" class="calendar-day-header">
        {{ day }}
      </div>

      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="[
          'calendar-cell',
          { 'other-month': !day.isCurrentMonth },
          { 'is-today': isToday(day.date) },
          { 'is-selected': isSameDay(day.date, selectedDay) },
        ]"
        @click="selectDay(day)"
      >
        <span class="cell-date">{{ day.date.getDate() }}</span>
        <div class="cell-events">
          <div
            v-for="event in getEventsForDate(day.date).slice(0, 3)"
            :key="event._id"
            :class="['cell-event', { 'cell-event-registered': isRegistered(event) }]"
            :title="event.title"
          >
            {{ event.title }}
          </div>
          <span
            v-if="getEventsForDate(day.date).length > 3"
            class="cell-more"
          >
            +{{ getEventsForDate(day.date).length - 3 }} autre(s)
          </span>
        </div>
      </div>
    </div>

    <!-- Vue Semaine -->
    <div v-if="viewMode === 'week'" class="calendar-grid week-grid">
      <div
        v-for="(day, index) in weekDays"
        :key="index"
        :class="[
          'week-day-col',
          { 'is-today': isToday(day.date) },
          { 'is-selected': isSameDay(day.date, selectedDay) },
        ]"
        @click="selectDay(day)"
      >
        <div class="week-day-header">
          <span class="week-day-name">{{ DAYS[index] }}</span>
          <span class="week-day-num">{{ day.date.getDate() }}</span>
        </div>
        <div class="week-day-events">
          <div
            v-for="event in getEventsForDate(day.date)"
            :key="event._id"
            :class="['week-event', { 'week-event-registered': isRegistered(event) }]"
            @click.stop="router.push(`/events/${event._id}`)"
          >
            <span class="week-event-time">{{ formatTime(event.date) }}</span>
            <span class="week-event-title">{{ event.title }}</span>
          </div>
          <div v-if="getEventsForDate(day.date).length === 0" class="week-empty">
            —
          </div>
        </div>
      </div>
    </div>

    <!-- Détail du jour sélectionné -->
    <div v-if="selectedDay" class="day-detail card">
      <h3>
        {{ selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
      </h3>

      <div v-if="selectedDayEvents.length === 0" class="day-empty">
        Aucun événement ce jour.
      </div>

      <div v-else class="day-events">
        <div
          v-for="event in selectedDayEvents"
          :key="event._id"
          class="day-event-item"
          @click="router.push(`/events/${event._id}`)"
        >
          <div class="day-event-time">{{ formatTime(event.date) }}</div>
          <div class="day-event-info">
            <h4>{{ event.title }}</h4>
            <p>{{ event.location }} — {{ event.participants.length }}/{{ event.maxParticipants }} inscrits</p>
          </div>
          <span
            v-if="isRegistered(event)"
            class="spots-badge spots-available"
          >
            Inscrit
          </span>
          <span
            v-else-if="event.availableSpots <= 0"
            class="spots-badge spots-full"
          >
            Complet
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-header {
  margin-bottom: 1.5rem;
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.calendar-nav {
  display: flex;
  gap: 0.25rem;
}

.calendar-label {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--dark);
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
}

/* Grille Mois */
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid var(--gray-light);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--white);
}

.calendar-day-header {
  padding: 0.5rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--gray);
  background: var(--gray-lighter);
  border-bottom: 1px solid var(--gray-light);
}

.calendar-cell {
  min-height: 90px;
  padding: 0.35rem;
  border: 1px solid var(--gray-light);
  cursor: pointer;
  transition: background 0.15s;
}

.calendar-cell:hover {
  background: var(--gray-lighter);
}

.calendar-cell.other-month {
  background: #f8fafc;
}

.calendar-cell.other-month .cell-date {
  color: #cbd5e1;
}

.calendar-cell.is-today .cell-date {
  background: var(--primary);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.calendar-cell.is-selected {
  background: #eff6ff;
  border-color: var(--primary);
}

.cell-date {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dark);
}

.cell-events {
  margin-top: 0.2rem;
}

.cell-event {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  margin-bottom: 0.15rem;
  border-radius: 3px;
  background: #dbeafe;
  color: #1e40af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-event-registered {
  background: #d1fae5;
  color: #065f46;
}

.cell-more {
  font-size: 0.65rem;
  color: var(--gray);
}

/* Grille Semaine */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.week-day-col {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  min-height: 200px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.week-day-col:hover {
  box-shadow: var(--shadow-md);
}

.week-day-col.is-today {
  border: 2px solid var(--primary);
}

.week-day-col.is-selected {
  border: 2px solid var(--secondary);
}

.week-day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid var(--gray-light);
}

.week-day-name {
  font-size: 0.75rem;
  color: var(--gray);
  font-weight: 600;
}

.week-day-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--dark);
}

.is-today .week-day-num {
  background: var(--primary);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-day-events {
  padding: 0.35rem;
}

.week-event {
  padding: 0.35rem 0.4rem;
  margin-bottom: 0.35rem;
  border-radius: 4px;
  background: #dbeafe;
  cursor: pointer;
}

.week-event:hover {
  background: #bfdbfe;
}

.week-event-registered {
  background: #d1fae5;
}

.week-event-registered:hover {
  background: #a7f3d0;
}

.week-event-time {
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e40af;
  display: block;
}

.week-event-title {
  font-size: 0.75rem;
  color: var(--dark);
}

.week-empty {
  text-align: center;
  color: var(--gray-light);
  padding: 1rem;
}

/* Détail du jour */
.day-detail {
  margin-top: 1.5rem;
}

.day-detail h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  text-transform: capitalize;
  color: var(--dark);
}

.day-empty {
  color: var(--gray);
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
}

.day-event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--gray-light);
}

.day-event-item:last-child {
  border-bottom: none;
}

.day-event-item:hover {
  background: var(--gray-lighter);
}

.day-event-time {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
}

.day-event-info {
  flex: 1;
}

.day-event-info h4 {
  font-size: 0.95rem;
  margin: 0;
  color: var(--dark);
}

.day-event-info p {
  font-size: 0.8rem;
  color: var(--gray);
  margin: 0.15rem 0 0;
}

@media (max-width: 768px) {
  .month-grid {
    font-size: 0.75rem;
  }

  .calendar-cell {
    min-height: 60px;
    padding: 0.2rem;
  }

  .cell-event {
    font-size: 0.6rem;
  }

  .week-grid {
    grid-template-columns: 1fr;
  }

  .week-day-col {
    min-height: auto;
  }

  .week-day-header {
    flex-direction: row;
    gap: 0.5rem;
  }
}
</style>
